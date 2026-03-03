import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaTools, FaQuoteLeft, FaCalendarCheck } from 'react-icons/fa';
import { getProfileById } from '../../services/profileService';
import '../worker/WorkerProfile.css'; // Reuse existing CSS for beautiful aesthetics

const PublicWorkerProfilePage = () => {
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
            const data = await getProfileById(id);
            setProfile(data);
        } catch (err) {
            // Requirement exactly asks for "Profile not found" on 404
            console.error(err);
            if (err.response && err.response.status === 404) {
                setError('Profile not found');
            } else {
                setError('Profile not found'); // Fallback to same msg for safety
            }
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
        <div className="wp-container" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="wp-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '450px', background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', color: '#9ca3af' }}>🔍</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#111827' }}>{error}</h3>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>We couldn't find the worker profile you're looking for. It may have been removed or the link might be broken.</p>
                <Link to="/" className="wp-btn-submit" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '0.75rem 2rem', borderRadius: '9999px', fontWeight: '500' }}>Browse Services</Link>
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
                                <div className="wp-profile-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', fontWeight: 'bold' }}>
                                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'W'}
                                </div>
                                <div className="wp-profile-info">
                                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.25rem' }}>{profile.fullName || 'Worker Profile'}</h1>
                                    <div className="wp-location-tag" style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '0.95rem' }}>
                                        <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#3b82f6' }} />
                                        <span>{profile.district || 'Location not specified'}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Read-only: No Edit buttons as per requirements */}
                        </div>
                    </div>

                    <div className="wp-view-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '2rem' }}>
                        {/* Left Column: Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {/* Bio Section */}
                            <section>
                                <h3 className="wp-section-title" style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                                    <FaQuoteLeft style={{ marginRight: '0.75rem', color: '#60a5fa' }} /> About
                                </h3>
                                <div className="wp-bio-box" style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.75rem', color: '#4b5563', lineHeight: '1.6', fontSize: '1rem', border: '1px solid #e5e7eb' }}>
                                    {profile.bio || 'No biography provided yet.'}
                                </div>
                            </section>

                            {/* Skills Section */}
                            <section>
                                <h3 className="wp-section-title" style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                                    <FaTools style={{ marginRight: '0.75rem', color: '#2563eb' }} /> Expertise
                                </h3>
                                <div className="wp-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {profile.skills && profile.skills.length > 0 ? (
                                        profile.skills.map((skill, index) => (
                                            <span key={index} className="wp-tag" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.5rem 1rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500', border: '1px solid #bfdbfe' }}>
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No skills listed.</span>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Right Column: Stats & Service Areas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Availability Card */}
                            <div className="wp-rate-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                <h4 className="wp-rate-title" style={{ color: '#10b981', display: 'flex', alignItems: 'center', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <FaCalendarCheck style={{ marginRight: '0.5rem' }} />
                                    Availability
                                </h4>
                                <div className="wp-rate-amount" style={{ fontSize: '1.5rem', color: '#111827', fontWeight: 'bold' }}>
                                    {profile.availability || 'Not Specified'}
                                </div>
                            </div>

                            {/* Service Areas */}
                            <div>
                                <h4 className="wp-section-title" style={{ display: 'flex', alignItems: 'center', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1f2937' }}>
                                    <FaMapMarkerAlt style={{ marginRight: '0.5rem', color: '#6366f1' }} /> Service Areas
                                </h4>
                                <div style={{ backgroundColor: '#f9fafb', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e5e7eb' }}>
                                    <ul className="wp-service-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {profile.serviceAreas && profile.serviceAreas.length > 0 ? (
                                            profile.serviceAreas.map((area, index) => (
                                                <li key={index} className="wp-service-item" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0', color: '#4b5563', borderBottom: index !== profile.serviceAreas.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                                                    <div className="wp-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1', marginRight: '0.75rem' }}></div>
                                                    <span style={{ fontWeight: '500' }}>{area}</span>
                                                </li>
                                            ))
                                        ) : (
                                            <li style={{ color: '#9ca3af', fontStyle: 'italic' }}>No specific areas listed.</li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicWorkerProfilePage;
