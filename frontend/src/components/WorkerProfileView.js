import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaUserEdit, FaTools, FaQuoteLeft, FaEnvelope, FaPhone, FaCalendarCheck } from 'react-icons/fa';
import '../styles/WorkerProfile.css'; // Import Vanilla CSS

const WorkerProfileView = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8081/api/profiles/${id}`);
            setProfile(response.data);
        } catch (err) {
            setError('Failed to fetch profile. It might not exist.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="wp-container">
            <div className="wp-spinner" style={{ border: '4px solid #e5e7eb', borderTop: '4px solid #2563eb', borderRadius: '50%', width: '3rem', height: '3rem' }}></div>
        </div>
    );

    if (error) return (
        <div className="wp-container">
            <div className="wp-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Oops! Something went wrong.</h3>
                <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>{error}</p>
                <Link to="/" className="wp-btn-submit" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '0.5rem 1.5rem' }}>Go Home</Link>
            </div>
        </div>
    );

    if (!profile) return null;

    return (
        <div className="wp-container">
            <div className="wp-wrapper wp-view-container">
                <div className="wp-card">
                    {/* Header Section */}
                    <div className="wp-view-header">
                        <div className="wp-view-header-content">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className="wp-profile-avatar">
                                    {profile.fullName ? profile.fullName.charAt(0) : 'U'}
                                </div>
                                <div className="wp-profile-info">
                                    <h1>{profile.fullName}</h1>
                                    <div className="wp-location-tag">
                                        <FaMapMarkerAlt style={{ marginRight: '0.5rem' }} />
                                        <span>{profile.district}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="wp-action-btns">
                                <Link
                                    to={`/edit-profile/${profile.id}`}
                                    className="wp-btn-edit"
                                >
                                    <FaUserEdit style={{ marginRight: '0.5rem' }} /> Edit Profile
                                </Link>
                                <button className="wp-btn-contact">
                                    <FaEnvelope style={{ marginRight: '0.5rem' }} /> Contact
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="wp-view-grid">
                        {/* Left Column: Details */}
                        <div style={{ gridColumn: 'span 1' }}>
                            {/* Bio Section */}
                            <section style={{ marginBottom: '2rem' }}>
                                <h3 className="wp-section-title">
                                    <FaQuoteLeft style={{ marginRight: '0.75rem', color: '#60a5fa' }} /> About Me
                                </h3>
                                <div className="wp-bio-box">
                                    {profile.bio}
                                </div>
                            </section>

                            {/* Skills Section */}
                            <section>
                                <h3 className="wp-section-title">
                                    <FaTools style={{ marginRight: '0.75rem', color: '#2563eb' }} /> Professional Skills
                                </h3>
                                <div className="wp-tags">
                                    {profile.skills.map((skill, index) => (
                                        <span key={index} className="wp-tag">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Stats & Service Areas */}
                        <div>
                            {/* Hourly Rate Card */}
                            <div className="wp-rate-card" style={{ marginBottom: '1.5rem' }}>
                                <h4 className="wp-rate-title">Hourly Rate</h4>
                                <div className="wp-rate-amount">
                                    <span style={{ fontSize: '1.25rem', marginRight: '0.25rem', verticalAlign: 'top' }}>LKR</span>
                                    {profile.hourlyRate}
                                </div>
                                <p className="wp-rate-sub">Available for hire</p>
                            </div>

                            {/* Availability Card */}
                            <div className="wp-rate-card" style={{ marginBottom: '2rem', borderLeftColor: '#10b981' }}>
                                <h4 className="wp-rate-title" style={{ color: '#10b981' }}>
                                    <FaCalendarCheck style={{ marginRight: '0.5rem' }} />
                                    Availability
                                </h4>
                                <div className="wp-rate-amount" style={{ fontSize: '1.5rem', color: '#111827' }}>
                                    {profile.availability || 'Not Specified'}
                                </div>
                            </div>

                            {/* Service Areas */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 className="wp-section-title">
                                    <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#6366f1' }} /> Service Areas
                                </h4>
                                <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #f3f4f6' }}>
                                    <ul className="wp-service-list">
                                        {profile.serviceAreas.map((area, index) => (
                                            <li key={index} className="wp-service-item">
                                                <div className="wp-dot"></div>
                                                {area}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Contact Placeholder */}
                            <div style={{ backgroundColor: '#111827', borderRadius: '0.75rem', padding: '1.5rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                <h4 style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Ready to hire?</h4>
                                <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1rem' }}>Contact this worker to discuss your project requirements.</p>
                                <button style={{ width: '100%', padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                                    <FaPhone style={{ marginRight: '0.5rem' }} /> View Phone Number
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkerProfileView;
