import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Breadcrumb from '../../components/common/Breadcrumb';
import { getRequestById, deleteRequest } from '../../services/requestService';
import { getQuotesByRequest } from '../../services/quoteService';
import { formatBudget } from '../../utils/constants';
import './RequestDetailsPage.css';

const RequestDetailsPage = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isWorker = !location.pathname.startsWith('/my-requests');
    
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Quotes (Seeker view)
    const [quotes, setQuotes] = useState([]);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [quotesError, setQuotesError] = useState('');

    const fetchQuotes = async () => {
        if (!requestId || isWorker) return;
        setQuotesLoading(true);
        setQuotesError('');
        try {
            const data = await getQuotesByRequest(Number(requestId));
            setQuotes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching quotations:', err);
            setQuotesError(err.response?.data?.message || 'Failed to load quotations. Please try again.');
            setQuotes([]);
        } finally {
            setQuotesLoading(false);
        }
    };

    useEffect(() => {
        const fetchRequestDetails = async () => {
            try {
                const data = await getRequestById(requestId);
                // Transform API data to match UI needs (handling missing fields with defaults)
                const transformedRequest = {
                    ...data,
                    postedDate: new Date(data.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }),
                    // Default values for fields potentially missing in backend
                    urgency: data.urgency || 'Standard',
                    budget: data.budget,
                    verification: 'Standard Request',
                    timeline: [
                        { status: "Request Posted", date: new Date(data.createdAt).toLocaleDateString(), active: true, completed: true },
                        { status: "Receiving Quotes", date: "In Progress", active: true, completed: false },
                        { status: "Hire Professional", date: "", active: false, completed: false },
                        { status: "Job Completion", date: "", active: false, completed: false }
                    ]
                };
                setRequest(transformedRequest);
            } catch (err) {
                console.error("Error fetching request details:", err);
                if (err.response && err.response.status === 404) {
                    setError('This request was not found. It may have been removed.');
                } else {
                    setError('Failed to load request details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (requestId) {
            fetchRequestDetails();
        }
    }, [requestId]);

    useEffect(() => {
        fetchQuotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId, isWorker]);

    if (loading) {
        return (
            <div className="page-wrapper">
                <div className="rd-loading">
                    <div className="rd-spinner"></div>
                    <p>Loading details...</p>
                </div>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="page-wrapper">
                <div className="rd-error">
                    <h3>Something went wrong</h3>
                    <p>{error || 'Request not found'}</p>
                    <Link to={isWorker ? '/browse-requests' : '/my-requests'} className="rd-btn-secondary">
                        {isWorker ? 'Back to Browse Requests' : 'Back to My Requests'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            
            <main className="rd-container">
                <Breadcrumb />
                <PageHeader title={`Request: ${request.title || request.category}`} />

                <div className="rd-breadcrumb">
                    <Link to={isWorker ? '/browse-requests' : '/my-requests'} className="rd-back-link">
                        <span className="material-icons">arrow_back</span> {isWorker ? 'Back to Browse Requests' : 'Back to My Requests'}
                    </Link>
                </div>

                <div className="rd-grid">
                    {/* Main Content Column */}
                    <div className="rd-main-col">
                        <div className="rd-card rd-details-card">
                            <div className="rd-card-header">
                                <div className="rd-meta-group">
                                    <span className="rd-id">#{request.id}</span>
                                    <span className="rd-divider">|</span>
                                    <span className="rd-date">Posted {request.postedDate}</span>
                                </div>
                                <span className="rd-status-badge">{request.status}</span>
                            </div>
                            
                            <div className="rd-card-body">
                                <div className="rd-title-row">
                                    <div>
                                        {/* Use title if available, otherwise category as title */}
                                        <h1 className="rd-title">{request.title || request.category}</h1>
                                        <p className="rd-category">{request.category}</p>
                                    </div>
                                    <div className="rd-actions">
                                        {!isWorker && (
                                            <>
                                                <button 
                                                    className="rd-btn rd-btn-secondary"
                                                    onClick={() => navigate('/create-request', { state: { requestToEdit: request } })}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button 
                                                    className="rd-btn rd-btn-danger"
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
                                                            try {
                                                                await deleteRequest(request.id);
                                                                navigate('/my-requests');
                                                            } catch (err) {
                                                                alert('Failed to delete request');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </>
                                        )}
                                        {isWorker && (
                                            <button
                                                className="rd-btn rd-btn-primary"
                                                onClick={() => alert('Quote submission is coming soon! This feature will be available in the next update.')}
                                            >
                                                📝 Send Quote
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="rd-info-grid">
                                    <div className="rd-info-item">
                                        <div className="rd-info-icon">
                                            <span className="rd-info-emoji">⏱️</span>
                                        </div>
                                        <div>
                                            <p className="rd-label">Urgency</p>
                                            <p className="rd-value">{request.urgency}</p>
                                        </div>
                                    </div>
                                    <div className="rd-info-item">
                                        <div className="rd-info-icon">
                                            <span className="rd-info-emoji">💰</span>
                                        </div>
                                        <div>
                                            <p className="rd-label">Budget</p>
                                            <p className="rd-value">{formatBudget(request.budget)}</p>
                                        </div>
                                    </div>
                                    <div className="rd-info-item">
                                        <div className="rd-info-icon">
                                            <span className="rd-info-emoji">📍</span>
                                        </div>
                                        <div>
                                            <p className="rd-label">Location</p>
                                            <p className="rd-value">{request.locationArea}</p>
                                        </div>
                                    </div>
                                    <div className="rd-info-item">
                                        <div className="rd-info-icon">
                                            <span className="rd-info-emoji">🛡️</span>
                                        </div>
                                        <div>
                                            <p className="rd-label">Verification</p>
                                            <p className="rd-value">{request.verification}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rd-description-section">
                                    <h3>Description</h3>
                                    <p className="rd-description">{request.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quotes Section (Seeker Only) */}
                        {!isWorker && (
                            <div className="rd-card rd-quotes-card">
                                <div className="rd-quotes-header">
                                    <h3>📜 Quotes Received</h3>
                                    <span className="rd-quotes-count">
                                        {quotesLoading ? '…' : quotes.length}
                                    </span>
                                </div>
                                
                                <div className="rd-quotes-body">
                                    {quotesLoading && (
                                        <div className="rd-quotes-loading">
                                            <div className="rd-spinner" />
                                            <p>Loading quotations…</p>
                                        </div>
                                    )}

                                    {!quotesLoading && quotesError && (
                                        <div className="rd-quotes-error" role="alert">
                                            <span className="material-icons">error_outline</span>
                                            <div>
                                                <h4>Couldn’t load quotations</h4>
                                                <p>{quotesError}</p>
                                                <button
                                                    className="rd-btn rd-btn-secondary"
                                                    type="button"
                                                    onClick={fetchQuotes}
                                                >
                                                    Try Again
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!quotesLoading && !quotesError && quotes.length === 0 && (
                                        <div className="rd-quotes-empty">
                                            <div className="rd-empty-icon-wrapper">
                                                <span className="rd-empty-emoji">⏳</span>
                                                <span className="rd-search-badge">🔍</span>
                                            </div>
                                            <h4>No quotations received yet</h4>
                                            <p>Workers haven’t submitted quotations for this request yet. Please check back soon.</p>
                                        </div>
                                    )}

                                    {!quotesLoading && !quotesError && quotes.length > 0 && (
                                        <div className="rd-quotes-list">
                                            <table className="rd-quotes-table" aria-label="Quotations received">
                                                <thead>
                                                    <tr>
                                                        <th>Worker</th>
                                                        <th>Price</th>
                                                        <th>ETA</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {quotes.map((q) => (
                                                        <tr key={q.id}>
                                                            <td data-label="Worker">
                                                                <Link to={`/workers/${q.workerId}`} className="rd-worker-link">
                                                                    <span className="rd-worker-avatar" aria-hidden="true">
                                                                        {(q.workerName || 'W').charAt(0).toUpperCase()}
                                                                    </span>
                                                                    <span className="rd-worker-name">{q.workerName || `Worker #${q.workerId}`}</span>
                                                                </Link>
                                                            </td>
                                                            <td data-label="Price" className="rd-quote-price">
                                                                LKR {Number(q.price).toLocaleString()}
                                                            </td>
                                                            <td data-label="ETA" className="rd-quote-eta">
                                                                {q.estimatedDays} {q.estimatedDays === 1 ? 'day' : 'days'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Column */}
                    <div className="rd-sidebar-col">
                        <div className="rd-card rd-timeline-card">
                            <h3>📈 Request Timeline</h3>
                            <div className="rd-timeline">
                                <div className="rd-timeline-line"></div>
                                {request.timeline.map((item, index) => (
                                    <div key={index} className={`rd-timeline-item ${item.active ? 'active' : ''} ${item.completed ? 'completed' : ''}`}>
                                        <div className="rd-timeline-marker">
                                            {item.completed ? '✓' : index + 1}
                                        </div>
                                        <div className="rd-timeline-content">
                                            <p className="rd-timeline-status">{item.status}</p>
                                            {item.date && <p className="rd-timeline-date">{item.date}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rd-card rd-map-card">
                            <div className="rd-map-placeholder">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlr0JM-MPQoAegLZS8W5LRqAinPbVNOYG4ZUju8ufz_vQLUtBcrad_uK9K3ujh9j4DHa8-Za85pg4sCDAOEnnw6xvVfgWitViKwAF90TCJGJ5_xgPLIRczXRB-QpjrpDzerBjh6ABsAlpD8ogpDkHsVhcHWKysFeD1SyuxpFeVU_R71wQT4KtNrUsfj9mb7Bbz8gpSfFQQm7Ia-jcUmfNl6kt3MJLVGggG2b7A2xw4L8My4yMCyH7oYR-Y6iaSf9mXsUeDWSCOX8c" alt="Map" />
                                <div className="rd-map-overlay">
                                    <p className="rd-map-label">Service Location</p>
                                    <p className="rd-map-value">{request.locationArea}</p>
                                </div>
                            </div>
                            <div className="rd-map-footer">
                                <span className="rd-verified-icon">🛡️</span>
                                <span>Professionals in this area are verified</span>
                            </div>
                        </div>

                        {!isWorker && (
                            <div className="rd-help-card">
                                <h3>Need Help?</h3>
                                <p>Our support team is available 24/7 to assist with your request.</p>
                                <button className="rd-support-btn">Contact Support</button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RequestDetailsPage;
