import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProfileById, createProfile, updateProfile } from '../../services/profileService';
import { CATEGORIES, DISTRICTS, SERVING_AREAS } from '../../utils/constants';
import './EditWorkerProfile.css';

/**
 * EditWorkerProfilePage — Modern Create/Edit Profile Design
 * Based on Figma mockup with modern form sections
 */
const EditWorkerProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingProfile, setFetchingProfile] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        contactNumber: '',
        bio: '',
        primaryCategories: [], // Array of category labels (Plumbing, Electrical, etc.)
        specificSkills: [], // Array of specific skill strings (Leak Repair, Wiring, etc.)
        district: '',
        serviceAreas: [], // Array of service area strings
        hourlyRate: '',
        availability: '',
        profilePictureUrl: ''
    });

    const [skillInput, setSkillInput] = useState('');

    const fetchProfile = useCallback(async () => {
        if (!id) return;

        try {
            setFetchingProfile(true);
            const data = await getProfileById(id);
            setFormData({
                fullName: data.fullName || '',
                contactNumber: data.contactNumber || '',
                bio: data.bio || '',
                primaryCategories: data.skills || [],
                specificSkills: [], // Backend doesn't have this yet
                district: data.district || '',
                serviceAreas: data.serviceAreas || [],
                hourlyRate: data.hourlyRate || '',
                availability: data.availability || '',
                profilePictureUrl: data.profilePictureUrl || ''
            });
        } catch (err) {
            setError('Failed to fetch profile');
            console.error(err);
        } finally {
            setFetchingProfile(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleCategoryToggle = (categoryLabel) => {
        setFormData(prev => ({
            ...prev,
            primaryCategories: prev.primaryCategories.includes(categoryLabel)
                ? prev.primaryCategories.filter(c => c !== categoryLabel)
                : [...prev.primaryCategories, categoryLabel]
        }));
    };

    const handleAddSkill = () => {
        const skill = skillInput.trim();
        if (skill && !formData.specificSkills.includes(skill)) {
            setFormData(prev => ({
                ...prev,
                specificSkills: [...prev.specificSkills, skill]
            }));
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            specificSkills: prev.specificSkills.filter(s => s !== skill)
        }));
    };

    const handleDistrictChange = (e) => {
        const newDistrict = e.target.value;
        setFormData(prev => ({
            ...prev,
            district: newDistrict,
            serviceAreas: [] // Reset service areas when district changes
        }));
    };

    const handleServiceAreaToggle = (area) => {
        setFormData(prev => ({
            ...prev,
            serviceAreas: prev.serviceAreas.includes(area)
                ? prev.serviceAreas.filter(a => a !== area)
                : [...prev.serviceAreas, area]
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setFormData(prev => ({ ...prev, profilePictureUrl: reader.result }));
            }
        };
        reader.onerror = () => {
            setError('Failed to process the selected photo. Please try a different image.');
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.primaryCategories.length === 0) {
            setError('Please select at least one primary service category');
            setLoading(false);
            return;
        }

        if (formData.serviceAreas.length === 0) {
            setError('Please select at least one service area');
            setLoading(false);
            return;
        }

        // Combine primary categories and specific skills for backend
        const allSkills = [...formData.primaryCategories, ...formData.specificSkills];

        const payload = {
            fullName: formData.fullName,
            contactNumber: formData.contactNumber,
            bio: formData.bio,
            profilePictureUrl: formData.profilePictureUrl || null,
            skills: allSkills,
            district: formData.district,
            serviceAreas: formData.serviceAreas,
            hourlyRate: parseFloat(formData.hourlyRate),
            availability: formData.availability
        };

        try {
            if (id) {
                await updateProfile(id, payload);
                navigate(`/profile/${id}`);
            } else {
                const data = await createProfile(payload);
                navigate(`/profile/${data.id}`);
            }
        } catch (err) {
            if (err.response?.data?.details) {
                const errorMessages = Object.values(err.response.data.details).join(', ');
                setError(`Validation Error: ${errorMessages}`);
            } else {
                setError(err.response?.data?.message || 'Failed to save profile. Please check all fields.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingProfile) {
        return (
            <div className="ewp-page">
                <div className="ewp-container">
                    <div className="ewp-loading">
                        <div className="ewp-loading-spinner"></div>
                        <span className="ewp-loading-text">Loading profile...</span>
                    </div>
                </div>
            </div>
        );
    }

    const availableServiceAreas = formData.district && SERVING_AREAS[formData.district]
        ? SERVING_AREAS[formData.district]
        : [];

    return (
        <div className="ewp-page">
            <div className="ewp-container">
                {/* Error Message */}
                {error && (
                    <div className="ewp-error">
                        <p className="ewp-error-text">
                            <span className="material-icons">error</span>
                            {error}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Professional Photo Section */}
                    <div className="ewp-section ewp-photo-section">
                        <div className="ewp-photo-upload">
                            <div className="ewp-avatar-circle">
                                {formData.profilePictureUrl ? (
                                    <img
                                        src={formData.profilePictureUrl}
                                        alt="Profile"
                                        className="ewp-avatar-img"
                                    />
                                ) : (
                                    <span className="material-icons ewp-avatar-placeholder">person</span>
                                )}
                                <label htmlFor="photo-upload" className="ewp-photo-badge">
                                    <span className="material-icons">add_a_photo</span>
                                </label>
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="ewp-photo-input"
                                />
                            </div>
                            <div className="ewp-photo-info">
                                <h3 className="ewp-photo-title">Professional Photo</h3>
                                <p className="ewp-photo-subtitle">
                                    Upload a clear photo of yourself so seekers can recognize you on your public profile
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="ewp-section">
                        <h2 className="ewp-section-title">Personal Information</h2>

                        <div className="ewp-grid-2">
                            {/* Full Name */}
                            <div className="ewp-form-group">
                                <label className="ewp-label">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="ewp-input"
                                    placeholder="e.g. Ruwan Perera"
                                    required
                                />
                            </div>

                            {/* Contact Number */}
                            <div className="ewp-form-group">
                                <label className="ewp-label">
                                    Contact Number
                                </label>
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleChange}
                                    className="ewp-input"
                                    placeholder="+94 77 123 4567"
                                    required
                                />
                            </div>
                        </div>

                        {/* Professional Bio */}
                        <div className="ewp-form-group">
                            <label className="ewp-label">
                                Professional Bio
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className="ewp-textarea"
                                placeholder="Briefly describe your experience and the quality of work you provide..."
                                required
                            />
                        </div>
                    </div>

                    {/* Work Expertise Section */}
                    <div className="ewp-section">
                        <h2 className="ewp-section-title">Work Expertise</h2>

                        {/* Primary Service Categories */}
                        <div className="ewp-form-group">
                            <label className="ewp-label">
                                Primary Service Categories
                            </label>
                            <div className="ewp-categories-grid">
                                {CATEGORIES.map((category) => (
                                    <label key={category.value} className="ewp-category-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={formData.primaryCategories.includes(category.label)}
                                            onChange={() => handleCategoryToggle(category.label)}
                                        />
                                        <div className="ewp-category-option">
                                            <span className="material-icons ewp-category-icon">
                                                {category.icon}
                                            </span>
                                            <span className="ewp-category-label">{category.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Specific Skills */}
                        <div className="ewp-form-group">
                            <label className="ewp-label">
                                Specific Skills
                            </label>

                            {/* Skill Chips Display */}
                            {formData.specificSkills.length > 0 && (
                                <div className="ewp-skills-chips">
                                    {formData.specificSkills.map((skill, index) => (
                                        <div key={index} className="ewp-skill-chip">
                                            <span>{skill}</span>
                                            <button
                                                type="button"
                                                className="ewp-skill-chip-remove"
                                                onClick={() => handleRemoveSkill(skill)}
                                            >
                                                <span className="material-icons">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Skill Input */}
                            <div className="ewp-skill-input-group">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSkill();
                                        }
                                    }}
                                    className="ewp-input"
                                    placeholder="Add a skill (e.g. Tile Laying)"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="ewp-add-skill-btn"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Rate & Availability */}
                    <div className="ewp-section">
                        <h2 className="ewp-section-title">Rate & Availability</h2>

                        <div className="ewp-grid-2">
                            {/* Hourly Rate */}
                            <div className="ewp-form-group">
                                <label className="ewp-label">
                                    Hourly Rate
                                </label>
                                <div className="ewp-input-group">
                                    <div className="ewp-input-prefix">
                                        <span>Rs.</span>
                                    </div>
                                    <input
                                        type="number"
                                        name="hourlyRate"
                                        value={formData.hourlyRate}
                                        onChange={handleChange}
                                        className="ewp-input ewp-input-with-prefix"
                                        placeholder="1500"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="ewp-form-group">
                                <label className="ewp-label">
                                    Availability
                                </label>
                                <select
                                    name="availability"
                                    value={formData.availability}
                                    onChange={handleChange}
                                    className="ewp-select"
                                    required
                                >
                                    <option value="">Select availability</option>
                                    <option value="Full Time">Full Time</option>
                                    <option value="Part Time">Part Time</option>
                                    <option value="Weekends Only">Weekends Only</option>
                                    <option value="Evenings">Evenings</option>
                                    <option value="Negotiable">Negotiable</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Service Coverage Section */}
                    <div className="ewp-section">
                        <h2 className="ewp-section-title">Service Coverage</h2>

                        {/* Base District */}
                        <div className="ewp-form-group">
                            <label className="ewp-label">
                                Base District
                            </label>
                            <select
                                name="district"
                                value={formData.district}
                                onChange={handleDistrictChange}
                                className="ewp-select"
                                required
                            >
                                <option value="">Select your base district</option>
                                {DISTRICTS.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Serving Areas */}
                        {formData.district && availableServiceAreas.length > 0 && (
                            <div className="ewp-form-group">
                                <label className="ewp-label">
                                    Serving Areas
                                </label>
                                <p className="ewp-helper-text" style={{ marginBottom: '12px' }}>
                                    Select the specific areas you are willing to travel to:
                                </p>
                                <div className="ewp-areas-grid">
                                    {availableServiceAreas.map((area) => (
                                        <label key={area} className="ewp-area-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={formData.serviceAreas.includes(area)}
                                                onChange={() => handleServiceAreaToggle(area)}
                                            />
                                            <span className="ewp-area-label">{area}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Map Preview Placeholder */}
                                <div className="ewp-map-preview">
                                    <span className="material-icons ewp-map-icon">map</span>
                                    <span className="ewp-map-text">MAP PREVIEW</span>
                                    <div className="ewp-map-badge">SRI LANKA</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="ewp-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="material-icons ewp-spinner">sync</span>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span>{id ? 'Update Profile' : 'Complete Registration'}</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditWorkerProfilePage;
