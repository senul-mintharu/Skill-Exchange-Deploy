import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getProfileById } from '../../services/profileService';
import './WorkerProfile.css';

/**
 * WorkerProfilePage.jsx — Worker Profile View (Modern Redesign)
 *
 * Features:
 * - Dark gradient page background
 * - Centered white card with modern sections
 * - Stats row, expertise tags, services grid
 * - Service areas with map placeholder
 * - Portfolio section
 * - Responsive design
 */
const WorkerProfilePage = () => {
    const { id } = useParams();
    const location = useLocation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProfileById(id);
            setProfile(data);
        } catch (err) {
            setError('Failed to fetch profile. It might not exist.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Get first name for "About" section
    const getFirstName = (fullName) => {
        if (!fullName) return 'Worker';
        return fullName.split(' ')[0];
    };

    // Get primary skill for verified badge
    const getPrimarySkill = (skills) => {
        if (!skills || skills.length === 0) return 'Professional';
        return skills[0];
    };

    // Generate service cards from skills
    const getServiceCards = (skills) => {
        const serviceMap = {
            'Plumbing': { icon: 'plumbing', title: 'Plumbing Services', desc: 'Pipe repairs, installations, and maintenance' },
            'Electrical': { icon: 'bolt', title: 'Electrical Work', desc: 'Wiring, repairs, and installations' },
            'Carpentry': { icon: 'carpenter', title: 'Carpentry', desc: 'Custom woodwork and furniture repairs' },
            'Painting': { icon: 'format_paint', title: 'Painting Services', desc: 'Interior and exterior painting' },
            'AC Repair': { icon: 'ac_unit', title: 'AC Servicing & Repair', desc: 'Installation, maintenance, and repairs' },
            'Cleaning': { icon: 'cleaning_services', title: 'Cleaning Services', desc: 'Deep cleaning and maintenance' },
            'Gardening': { icon: 'yard', title: 'Gardening', desc: 'Landscaping and garden maintenance' },
            'Masonry': { icon: 'construction', title: 'Masonry Work', desc: 'Brick, stone, and concrete work' },
            'Roofing': { icon: 'roofing', title: 'Roofing Services', desc: 'Roof repairs and installations' },
            'Appliance Repair': { icon: 'kitchen', title: 'Appliance Repair', desc: 'Home appliance repairs and maintenance' },
            'CCTV': { icon: 'videocam', title: 'Security Systems', desc: 'CCTV installation and setup' },
            'default': { icon: 'build', title: 'General Services', desc: 'Professional handyman services' }
        };

        if (!skills || skills.length === 0) {
            return [serviceMap.default];
        }

        return skills.slice(0, 4).map(skill => {
            const match = Object.keys(serviceMap).find(key =>
                skill.toLowerCase().includes(key.toLowerCase())
            );
            return match ? serviceMap[match] : {
                icon: 'handyman',
                title: skill,
                desc: `Professional ${skill.toLowerCase()} services`
            };
        });
    };

    // Skeleton Loading Component
    const SkeletonLoader = () => (
        <div className="wpp-page">
            <div className="wpp-card">
                {/* Header Skeleton */}
                <div className="wpp-header">
                    <div className="wpp-skeleton wpp-skeleton-avatar"></div>
                    <div className="wpp-header-content">
                        <div className="wpp-skeleton wpp-skeleton-name"></div>
                        <div className="wpp-skeleton wpp-skeleton-badge"></div>
                        <div className="wpp-skeleton wpp-skeleton-text"></div>
                        <div className="wpp-header-actions">
                            <div className="wpp-skeleton wpp-skeleton-button"></div>
                            <div className="wpp-skeleton wpp-skeleton-button"></div>
                        </div>
                    </div>
                </div>

                {/* Stats Skeleton */}
                <div className="wpp-stats">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="wpp-skeleton wpp-skeleton-stat"></div>
                    ))}
                </div>

                {/* Skills Skeleton */}
                <div className="wpp-section">
                    <div className="wpp-skeleton wpp-skeleton-name" style={{ marginBottom: '16px' }}></div>
                    <div className="wpp-skills">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="wpp-skeleton wpp-skeleton-tag"></div>
                        ))}
                    </div>
                </div>

                {/* About Skeleton */}
                <div className="wpp-section">
                    <div className="wpp-skeleton wpp-skeleton-name" style={{ marginBottom: '16px' }}></div>
                    <div className="wpp-skeleton wpp-skeleton-bio"></div>
                </div>

                {/* Services Skeleton */}
                <div className="wpp-section">
                    <div className="wpp-skeleton wpp-skeleton-name" style={{ marginBottom: '16px' }}></div>
                    <div className="wpp-services-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="wpp-skeleton wpp-skeleton-service"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return <SkeletonLoader />;

    if (error) return (
        <div className="wpp-page">
            <div className="wpp-card">
                <div className="wpp-error">
                    <div className="wpp-error-icon">
                        <span className="material-icons">error_outline</span>
                    </div>
                    <h2 className="wpp-error-title">Oops! Something went wrong</h2>
                    <p className="wpp-error-text">{error}</p>
                    <Link to="/browse-workers" className="wpp-btn-primary">
                        Back to Workers
                    </Link>
                </div>
            </div>
        </div>
    );

    if (!profile) return null;

    const serviceCards = getServiceCards(profile.skills);
    const showProfileCreatedCTA = !!location.state?.profileCreated;

    return (
        <div className="wpp-page">
            <div className="wpp-card">
                {showProfileCreatedCTA && (
                    <div className="wpp-profile-notice" role="status">
                        <div className="wpp-profile-notice__content">
                            <span className="material-icons">check_circle</span>
                            <p>Your worker profile is ready. Start finding jobs now.</p>
                        </div>
                        <Link to="/browse-requests" className="wpp-profile-notice__cta">
                            Find Work
                        </Link>
                    </div>
                )}

                {/* Profile Header */}
                <div className="wpp-header">
                    <div className="wpp-avatar-container">
                        <div className="wpp-avatar">
                            {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'W'}
                        </div>
                        <div className="wpp-avatar-badge">
                            <span className="material-icons">verified</span>
                        </div>
                    </div>
                    <div className="wpp-header-content">
                        <h1 className="wpp-name">{profile.fullName || 'Worker'}</h1>
                        <div className="wpp-verified-badge">
                            <span className="material-icons">verified</span>
                            <span>Verified Skilled {getPrimarySkill(profile.skills)}</span>
                        </div>
                        <p className="wpp-member-info">
                            Member since 2024 • Response time: &lt; 2 hours
                        </p>
                        {profile.hourlyRate > 0 && (
                            <div className="wpp-hourly-rate">
                                <span className="material-icons">payments</span>
                                <span className="wpp-rate-amount">Rs. {profile.hourlyRate.toLocaleString()}</span>
                                <span className="wpp-rate-period">/ hour</span>
                            </div>
                        )}
                        <div className="wpp-header-actions">
                            <button className="wpp-btn-primary">
                                Invite to Job
                            </button>
                            <button className="wpp-btn-secondary">
                                Message
                            </button>
                            <button className="wpp-btn-icon">
                                <span className="material-icons">share</span>
                            </button>
                            <button className="wpp-btn-icon">
                                <span className="material-icons">more_horiz</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="wpp-stats">
                    <div className="wpp-stat-card">
                        <span className="material-icons wpp-stat-icon rating">star</span>
                        <span className="wpp-stat-value">4.9/5</span>
                        <span className="wpp-stat-label">Rating</span>
                    </div>
                    <div className="wpp-stat-card">
                        <span className="material-icons wpp-stat-icon jobs">work</span>
                        <span className="wpp-stat-value">186</span>
                        <span className="wpp-stat-label">Jobs Done</span>
                    </div>
                    <div className="wpp-stat-card">
                        <span className="material-icons wpp-stat-icon experience">emoji_events</span>
                        <span className="wpp-stat-value">10+</span>
                        <span className="wpp-stat-label">Years Exp.</span>
                    </div>
                    <div className="wpp-stat-card">
                        <span className="material-icons wpp-stat-icon location">location_on</span>
                        <span className="wpp-stat-value">{profile.district || 'N/A'}</span>
                        <span className="wpp-stat-label">Location</span>
                    </div>
                </div>

                {/* Expertise Section */}
                {profile.skills && profile.skills.length > 0 && (
                    <div className="wpp-section">
                        <h2 className="wpp-section-title">Expertise</h2>
                        <div className="wpp-skills">
                            {profile.skills.map((skill, index) => (
                                <span key={index} className="wpp-skill-tag">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* About Section */}
                {profile.bio && (
                    <div className="wpp-section">
                        <h2 className="wpp-section-title">About {getFirstName(profile.fullName)}</h2>
                        <p className="wpp-about-text">{profile.bio}</p>
                    </div>
                )}

                {/* Services Offered */}
                <div className="wpp-section">
                    <h2 className="wpp-section-title">Services Offered</h2>
                    <div className="wpp-services-grid">
                        {serviceCards.map((service, index) => (
                            <div key={index} className="wpp-service-card">
                                <div className="wpp-service-icon">
                                    <span className="material-icons">{service.icon}</span>
                                </div>
                                <div className="wpp-service-content">
                                    <h3 className="wpp-service-title">{service.title}</h3>
                                    <p className="wpp-service-desc">{service.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Service Areas */}
                <div className="wpp-section">
                    <h2 className="wpp-section-title">Service Areas</h2>
                    <div className="wpp-location-info">
                        <span className="material-icons">place</span>
                        <span>Based in {profile.district || 'Sri Lanka'}, serving the following areas:</span>
                    </div>
                    <div className="wpp-map-placeholder">
                        <div className="wpp-map-overlay">
                            <div className="wpp-area-tags">
                                {profile.serviceAreas && profile.serviceAreas.length > 0 ? (
                                    profile.serviceAreas.map((area, index) => (
                                        <span key={index} className="wpp-area-tag">{area}</span>
                                    ))
                                ) : (
                                    <>
                                        <span className="wpp-area-tag">{profile.district || 'Local Area'}</span>
                                        <span className="wpp-area-tag">Nearby Cities</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Portfolio Section */}
                <div className="wpp-section">
                    <div className="wpp-section-header">
                        <h2 className="wpp-section-title">Portfolio & Past Work</h2>
                        <button className="wpp-view-all">View All</button>
                    </div>
                    <div className="wpp-portfolio-grid">
                        <div className="wpp-portfolio-item">
                            <span className="material-icons">image</span>
                        </div>
                        <div className="wpp-portfolio-item">
                            <span className="material-icons">image</span>
                        </div>
                        <div className="wpp-portfolio-item">
                            <span className="material-icons">image</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerProfilePage;
