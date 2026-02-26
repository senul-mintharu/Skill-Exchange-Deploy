import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRequests } from '../../services/requestService';
import './MyRequestsPage.css';
import Navbar from '../../components/common/Navbar';

/**
 * MyRequestsPage.jsx — Seeker's Requests List Page
 * 
 * Displays all service requests posted by the current seeker.
 * Uses custom CSS for styling (no Tailwind).
 */

const MyRequestsPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        setError('');
        
        try {
            const data = await getMyRequests();
            setRequests(data);
        } catch (err) {
            console.error('Error fetching requests:', err);
            setError('Failed to load requests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Helper for category emojis
    const getCategoryEmoji = (category) => {
        const emojis = {
            PLUMBING: '🔧',
            ELECTRICAL: '⚡',
            CARPENTRY: '🪚',
            PAINTING: '🎨',
            CLEANING: '🧹',
            AC_REPAIR: '❄️',
            APPLIANCE_REPAIR: '🔌',
            GARDENING: '🌱',
            MASONRY: '🧱',
            ROOFING: '🏠',
            PEST_CONTROL: '🐛',
            OTHER: '⋯'
        };
        return emojis[category] || '📋';
    };

    const formatCategory = (category) => {
        if (!category) return 'Service Request';
        return category.charAt(0) + category.slice(1).toLowerCase().replace('_', ' ');
    };

    const getStatusClass = (status) => {
        return `status-badge status-${status.toLowerCase().replace('_', '-')}`;
    };

    const formatStatus = (status) => {
        return status.replace('_', ' ');
    };
    
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-text">Loading requests...</div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <Navbar variant="portal" />

            {/* Header */}
            <header className="page-header">
                <div className="header-container">
                    <div className="header-content">
                        <div className="header-text">
                            <h1>My Service Requests</h1>
                            <p>Track and manage your ongoing service jobs.</p>
                        </div>
                        <div className="header-actions">
                            <button className="filter-btn">
                                <span className="meta-emoji">🔍</span>
                                Filter
                            </button>
                            <button 
                                onClick={() => navigate('/create-request')}
                                className="create-btn"
                            >
                                <span className="meta-emoji">✨</span>
                                Create New Request
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-grid">
                    {/* Sidebar */}
                    <aside className="sidebar">
                        <nav className="sidebar-nav">
                            <a href="#" className="sidebar-link active">
                                <span className="sidebar-icon">📋</span>
                                Active Requests
                                <span className="sidebar-badge">{requests.length}</span>
                            </a>
                            <a href="#" className="sidebar-link">
                                <span className="sidebar-icon">📜</span>
                                History
                            </a>
                            <a href="#" className="sidebar-link">
                                <span className="sidebar-icon">📝</span>
                                Drafts
                            </a>
                            <div className="sidebar-divider">
                                <p className="sidebar-label">Quick Stats</p>
                                <div className="sidebar-stats">
                                    <div className="stats-label">Total Spent This Month</div>
                                    <div className="stats-value">LKR 0</div>
                                </div>
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <div className="requests-section">
                        {/* Mobile tabs */}
                        <div className="mobile-tabs">
                            <button className="mobile-tab active">All Requests</button>
                            <button className="mobile-tab">Open</button>
                            <button className="mobile-tab">In Progress</button>
                            <button className="mobile-tab">Completed</button>
                        </div>

                        {error && (
                            <div className="alert-error">
                                {error}
                            </div>
                        )}

                        {requests.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">
                                    <span className="material-icons">assignment_late</span>
                                </div>
                                <h3>No requests yet</h3>
                                <p>Get started by posting your first service request.</p>
                                <button 
                                    onClick={() => navigate('/create-request')}
                                    className="btn btn-primary"
                                >
                                    Create Request
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="requests-grid">
                                    {requests.map(request => (
                                        <div key={request.id} className="request-card">
                                            <div className="card-header">
                                                <div className="card-title">
                                                    <span className="category-icon">
                                                        <span className="category-emoji">{getCategoryEmoji(request.category)}</span>
                                                    </span>
                                                    <h3>{request.title || formatCategory(request.category)}</h3>
                                                </div>
                                                <span className={getStatusClass(request.status)}>
                                                    {formatStatus(request.status)}
                                                </span>
                                            </div>
                                            <p className="card-description">
                                                {request.description}
                                            </p>
                                            <div className="card-meta">
                                                <div className="meta-item">
                                                    <span className="meta-emoji">📅</span>
                                                    {formatDate(request.createdAt)}
                                                </div>
                                                <div className="meta-item">
                                                    <span className="meta-emoji">📍</span>
                                                    {request.locationArea}
                                                </div>
                                                <div className="meta-item meta-quotes">
                                                    <span className="meta-emoji">💬</span>
                                                    0 Quotes
                                                </div>
                                            </div>
                                            <button 
                                            className="card-button"
                                            onClick={() => navigate(`/my-requests/${request.id}`)}
                                        >
                                            View Details
                                            <span className="meta-emoji">→</span>
                                        </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {requests.length > 0 && (
                                    <div className="load-more">
                                        <button className="load-more-btn">
                                            Load More Requests
                                            <span className="meta-emoji">⬇</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="page-footer">
                <div className="footer-container">
                    <p className="footer-copyright">© 2023 SkillLink Lanka. All rights reserved.</p>
                    <div className="footer-links">
                        <a href="#" className="footer-link">Privacy Policy</a>
                        <a href="#" className="footer-link">Terms of Service</a>
                        <a href="#" className="footer-link">Help Center</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MyRequestsPage;
