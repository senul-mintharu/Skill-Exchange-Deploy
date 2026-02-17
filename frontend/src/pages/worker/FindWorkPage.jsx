import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { getOpenRequests } from '../../services/requestService';
import './FindWorkPage.css';

/**
 * FindWorkPage.jsx — Worker Portal
 * 
 * Allows workers to browse all open service requests.
 * Fetches data from getOpenRequests API.
 */
const FindWorkPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await getOpenRequests();
            // Transform data if needed, or use as is
            // Ensure date handling is safe
            const formattedData = data.map(req => ({
                ...req,
                postedDate: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently',
                budget: req.budget || 'Negotiable'
            }));
            setRequests(formattedData);
        } catch (err) {
            console.error('Error fetching open requests:', err);
            setError('Failed to load available jobs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get icon for category (could be moved to a util)
    const getCategoryIcon = (category) => {
        const icons = {
            'PLUMBING': '🔧',
            'ELECTRICAL': '⚡',
            'CARPENTRY': '🪚',
            'PAINTING': '🎨',
            'CLEANING': '🧹',
            'AC_REPAIR': '❄️',
            'APPLIANCE_REPAIR': '🔌',
            'GARDENING': '🌱',
            'MASONRY': '🧱',
            'ROOFING': '🏠',
            'PEST_CONTROL': '🐛',
            'OTHER': '⋯'
        };
        return icons[category] || '🔨';
    };

    return (
        <div className="page-wrapper">
            <Navbar variant="portal" />

            <main className="find-work-container">
                <div className="fw-header">
                    <h1 className="fw-title">Find Work</h1>
                    <p className="fw-subtitle">Browse open requests and send quotes to start your next job.</p>
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
                        <button className="btn btn-primary" onClick={fetchRequests}>Try Again</button>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="fw-empty">
                        <span className="material-icons fw-empty-icon">search_off</span>
                        <h3>No open requests found</h3>
                        <p>Check back later for new opportunities!</p>
                    </div>
                ) : (
                    <div className="fw-grid">
                        {requests.map(req => (
                            <div key={req.id} className="fw-card">
                                <div className="fw-card-header">
                                    <span className="fw-category-badge">
                                        {getCategoryIcon(req.category)} {req.category}
                                    </span>
                                    <div className={`fw-urgency-badge ${req.urgency ? req.urgency.toLowerCase() : 'medium'}`}>
                                        {req.urgency || 'MEDIUM'}
                                    </div>
                                </div>
                                
                                <div className="fw-card-body">
                                    <h3 className="fw-card-title">{req.title || req.category}</h3>
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
                                        <span className="fw-budget-value">{req.budget}</span>
                                    </div>
                                    <Link to={`/requests/${req.id}`} className="fw-quote-btn">
                                        <span className="material-icons">send</span>
                                        Quote Now
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default FindWorkPage;
