import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllProfiles } from '../../services/profileService';
import { CATEGORIES, DISTRICTS } from '../../utils/constants';
import './BrowseWorkersPage.css';

/**
 * BrowseWorkersPage.jsx — Browse Available Service Providers (Seeker)
 *
 * SCRUM-71: Allows service seekers to browse all registered skilled workers.
 * SCRUM-72: Added skill dropdown filter for filtering workers by skill category.
 * SCRUM-73: Added service area dropdown filter for filtering workers by location.
 * Features: Modern card design, skill filter dropdown, location filter, loading skeletons, empty state.
 */
const BrowseWorkersPage = () => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Client-side filters
    const [selectedSkill, setSelectedSkill] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    const hasActiveFilters = !!(selectedSkill || selectedLocation);

    const fetchWorkers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllProfiles();
            setWorkers(data.data || []);
        } catch (err) {
            console.error('Error fetching workers:', err);
            setError('Failed to load service providers. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    // Client-side filtering
    const filteredWorkers = workers.filter(worker => {
        // SCRUM-72: Filter by selected skill category
        const selectedCategory = CATEGORIES.find(c => c.value === selectedSkill);
        const matchesSkill = !selectedSkill ||
            (worker.skills && worker.skills.some(skill =>
                skill.toLowerCase().includes(selectedCategory?.label.toLowerCase() || '')
            ));

        // SCRUM-73: Filter by selected service area (district)
        const matchesLocation = !selectedLocation ||
            (worker.district && worker.district === selectedLocation) ||
            (worker.serviceAreas && worker.serviceAreas.some(area =>
                area.includes(selectedLocation)
            ));

        return matchesSkill && matchesLocation;
    });

    const handleClearFilters = () => {
        setSelectedSkill('');
        setSelectedLocation('');
    };

    // Generate avatar colors based on name
    const getAvatarGradient = (name) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        ];
        const index = name ? name.charCodeAt(0) % gradients.length : 0;
        return gradients[index];
    };

    // Skeleton cards for loading state
    const SkeletonCard = () => (
        <div className="bw-card bw-skeleton-card">
            <div className="bw-card-top">
                <div className="bw-skeleton bw-skeleton-avatar"></div>
                <div className="bw-skeleton-info">
                    <div className="bw-skeleton bw-skeleton-name"></div>
                    <div className="bw-skeleton bw-skeleton-skill"></div>
                </div>
            </div>
            <div className="bw-card-middle">
                <div className="bw-skeleton bw-skeleton-bio"></div>
                <div className="bw-skeleton bw-skeleton-bio short"></div>
            </div>
            <div className="bw-skeleton-tags">
                <div className="bw-skeleton bw-skeleton-tag"></div>
                <div className="bw-skeleton bw-skeleton-tag"></div>
                <div className="bw-skeleton bw-skeleton-tag"></div>
            </div>
            <div className="bw-card-bottom">
                <div className="bw-skeleton bw-skeleton-rate"></div>
                <div className="bw-skeleton bw-skeleton-btn"></div>
            </div>
        </div>
    );

    return (
        <div className="bw-page">
            {/* Hero Section */}
            <div className="bw-hero">
                <div className="bw-hero-content">
                    <h1 className="bw-hero-title">
                        Find Your Perfect
                        <span className="bw-hero-highlight"> Service Provider</span>
                    </h1>
                    <p className="bw-hero-subtitle">
                        Browse through our verified skilled workers and find the right expert for your needs
                    </p>
                </div>
                <div className="bw-hero-decoration">
                    <div className="bw-hero-circle bw-hero-circle-1"></div>
                    <div className="bw-hero-circle bw-hero-circle-2"></div>
                    <div className="bw-hero-circle bw-hero-circle-3"></div>
                </div>
            </div>

            {/* Search Section */}
            <div className="bw-search-section">
                <div className="bw-search-container">
                    <div className="bw-search-box">
                        <div className="bw-search-input-wrapper">
                            <span className="material-icons bw-search-icon">handyman</span>
                            <select
                                value={selectedSkill}
                                onChange={(e) => setSelectedSkill(e.target.value)}
                                className="bw-skill-select"
                            >
                                <option value="">All Skills</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="bw-search-divider"></div>
                        <div className="bw-search-input-wrapper">
                            <span className="material-icons bw-search-icon">location_on</span>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="bw-location-select"
                            >
                                <option value="">All Locations</option>
                                {DISTRICTS.map(district => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {hasActiveFilters && (
                            <button onClick={handleClearFilters} className="bw-clear-btn">
                                <span className="material-icons">close</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bw-content">
                {loading ? (
                    <div className="bw-grid">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bw-state-container">
                        <div className="bw-state-icon bw-state-error">
                            <span className="material-icons">cloud_off</span>
                        </div>
                        <h3 className="bw-state-title">Oops! Something went wrong</h3>
                        <p className="bw-state-text">{error}</p>
                        <button className="bw-btn bw-btn-primary" onClick={fetchWorkers}>
                            <span className="material-icons">refresh</span>
                            Try Again
                        </button>
                    </div>
                ) : filteredWorkers.length === 0 ? (
                    <div className="bw-state-container">
                        <div className="bw-state-icon bw-state-empty">
                            <span className="material-icons">person_search</span>
                        </div>
                        <h3 className="bw-state-title">
                            {selectedLocation
                                ? 'No workers found in this area'
                                : selectedSkill
                                    ? 'No workers found for this skill'
                                    : 'No workers available'}
                        </h3>
                        <p className="bw-state-text">
                            {selectedLocation
                                ? `No workers are currently serving in ${selectedLocation}. Try selecting a different area or check back later.`
                                : selectedSkill
                                    ? `No workers have "${CATEGORIES.find(c => c.value === selectedSkill)?.label}" listed in their skills.`
                                    : 'Be the first to join our platform or check back later!'}
                        </p>
                        {hasActiveFilters && (
                            <button className="bw-btn bw-btn-primary" onClick={handleClearFilters}>
                                <span className="material-icons">filter_alt_off</span>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="bw-results-header">
                            <p className="bw-results-count">
                                Showing <strong>{filteredWorkers.length}</strong> {filteredWorkers.length === 1 ? 'worker' : 'workers'}
                                {hasActiveFilters && ' matching your search'}
                            </p>
                        </div>

                        <div className="bw-grid">
                            {filteredWorkers.map(worker => (
                                <div key={worker.id} className="bw-card">
                                        <div className="bw-card-accent"></div>

                                        {/* Card Header */}
                                        <div className="bw-card-top">
                                            <div
                                                className="bw-avatar"
                                                style={{ background: getAvatarGradient(worker.fullName) }}
                                            >
                                                {worker.profilePictureUrl ? (
                                                    <img
                                                        src={worker.profilePictureUrl}
                                                        alt={`${worker.fullName || 'Worker'} avatar`}
                                                        className="bw-avatar-image"
                                                    />
                                                ) : (
                                                    <span className="bw-avatar-text">
                                                        {worker.fullName ? worker.fullName.charAt(0).toUpperCase() : 'W'}
                                                    </span>
                                                )}
                                                <div className="bw-avatar-badge">
                                                    <span className="material-icons">verified</span>
                                                </div>
                                            </div>
                                            <div className="bw-card-info">
                                                <h3 className="bw-card-name">
                                                    <Link to={`/workers/${worker.id}`} className="bw-card-name-link">
                                                        {worker.fullName || 'Worker'}
                                                    </Link>
                                                </h3>
                                                <div className="bw-card-role">
                                                    <span className="material-icons">handyman</span>
                                                    {worker.skills && worker.skills.length > 0
                                                        ? worker.skills[0]
                                                        : 'General Worker'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Location & Rating */}
                                        <div className="bw-card-meta">
                                            <div className="bw-meta-location">
                                                <span className="material-icons">place</span>
                                                {worker.district || 'Not specified'}
                                            </div>
                                            <div className="bw-meta-rating">
                                                <span className="material-icons">star</span>
                                                <span>4.8</span>
                                                <span className="bw-rating-count">(24)</span>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        {worker.bio && (
                                            <p className="bw-card-bio">{worker.bio}</p>
                                        )}

                                        {/* Skills */}
                                        {worker.skills && worker.skills.length > 0 && (
                                            <div className="bw-skill-tags">
                                                {worker.skills.slice(0, 3).map((skill, index) => (
                                                    <span key={index} className="bw-skill-tag">{skill}</span>
                                                ))}
                                                {worker.skills.length > 3 && (
                                                    <span className="bw-skill-tag bw-skill-more">+{worker.skills.length - 3}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="bw-card-bottom">
                                            <div className="bw-rate">
                                                {worker.hourlyRate > 0 ? (
                                                    <>
                                                        <span className="bw-rate-amount">Rs. {worker.hourlyRate.toLocaleString()}</span>
                                                        <span className="bw-rate-period">/hour</span>
                                                    </>
                                                ) : (
                                                    <span className="bw-rate-negotiable">Contact for rates</span>
                                                )}
                                            </div>
                                            <Link to={`/workers/${worker.id}`} className="bw-view-profile">
                                                View Profile
                                                <span className="material-icons">arrow_forward</span>
                                            </Link>
                                        </div>
                                    </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BrowseWorkersPage;
