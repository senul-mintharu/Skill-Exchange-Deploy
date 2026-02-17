import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequest } from '../../services/requestService';
import './CreateRequestPage.css';
import Navbar from '../../components/common/Navbar';

/**
 * Multi-Step Request Creation Wizard
 * Step 1: Category & Location
 * Step 2: Details & Description
 * Step 3: Urgency & Review
 */
const CreateRequestPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        category: '',
        locationArea: '',
        description: '',
        urgency: 'MEDIUM'
    });

    const [errors, setErrors] = useState({});

    // Category options with icons
    const categories = [
        { value: 'PLUMBING', label: 'Plumbing', icon: '🔧' },
        { value: 'ELECTRICAL', label: 'Electrical', icon: '⚡' },
        { value: 'CARPENTRY', label: 'Carpentry', icon: '🪚' },
        { value: 'PAINTING', label: 'Painting', icon: '🎨' },
        { value: 'CLEANING', label: 'Cleaning', icon: '🧹' },
        { value: 'AC_REPAIR', label: 'AC Repair', icon: '❄️' },
        { value: 'APPLIANCE_REPAIR', label: 'Appliance', icon: '🔌' },
        { value: 'GARDENING', label: 'Gardening', icon: '🌱' },
        { value: 'MASONRY', label: 'Masonry', icon: '🧱' },
        { value: 'ROOFING', label: 'Roofing', icon: '🏠' },
        { value: 'PEST_CONTROL', label: 'Pest Control', icon: '🐛' },
        { value: 'OTHER', label: 'Other', icon: '⋯' }
    ];

    const urgencyOptions = [
        { value: 'LOW', label: 'Low', subtitle: 'Within a week', icon: '📅' },
        { value: 'MEDIUM', label: 'Medium', subtitle: 'Within 48 hours', icon: '⏰' },
        { value: 'HIGH', label: 'High', subtitle: 'ASAP / Today', icon: '⚡' },
        { value: 'URGENT', label: 'Urgent', subtitle: 'Emergency', icon: '🚨' }
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            if (!formData.category) newErrors.category = 'Please select a category';
            if (!formData.locationArea?.trim()) newErrors.locationArea = 'Location is required';
        }

        if (step === 2) {
            if (!formData.description?.trim()) {
                newErrors.description = 'Description is required';
            } else if (formData.description.trim().length < 20) {
                newErrors.description = 'Description must be at least 20 characters';
            } else if (formData.description.length > 2000) {
                newErrors.description = 'Description must not exceed 2000 characters';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            await createRequest(formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/my-requests');
            }, 2000);
        } catch (err) {
            console.error('Error creating request:', err);
            setError(
                err.response?.data?.message ||
                'Failed to create request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Category & Location
    const renderStep1 = () => (
        <div className="step-content">
            <div className="step-header">
                <h1>What do you need help with?</h1>
                <p>Select a category to get started.</p>
            </div>

            <div className="form-section">
                <label className="section-label">Service Category</label>
                <div className="category-grid">
                    {categories.map(cat => (
                        <label key={cat.value} className="category-card">
                            <input
                                type="radio"
                                name="category"
                                value={cat.value}
                                checked={formData.category === cat.value}
                                onChange={(e) => handleChange('category', e.target.value)}
                                className="category-radio"
                            />
                            <div className="category-card-content">
                                <div className="category-icon">{cat.icon}</div>
                                <span className="category-label">{cat.label}</span>
                                {formData.category === cat.value && (
                                    <div className="check-icon">✓</div>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
                {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-section">
                <label className="section-label" htmlFor="location">
                    Where is the task located?
                </label>
                <div className="location-input-wrapper">
                    <span className="input-icon">📍</span>
                    <input
                        type="text"
                        id="location"
                        value={formData.locationArea}
                        onChange={(e) => handleChange('locationArea', e.target.value)}
                        placeholder="Enter area or city (e.g., Colombo 03)"
                        className={`location-input ${errors.locationArea ? 'error' : ''}`}
                    />
                </div>
                {errors.locationArea && <span className="error-message">{errors.locationArea}</span>}
            </div>
        </div>
    );

    // Step 2: Details & Urgency
    const renderStep2 = () => (
        <div className="step-content">
            <div className="step-header">
                <h1>Tell us about your task</h1>
                <p>Please provide specific details so taskers can give you an accurate offer.</p>
            </div>

            <div className="form-section">
                <div className="label-row">
                    <label className="section-label" htmlFor="description">
                        Task Description
                    </label>
                    <span className="char-count">
                        {formData.description.length} / 2000
                    </span>
                </div>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Example: I need a leaking tap fixed in the kitchen. It seems to be dripping from the handle. I have a replacement washer if needed, but might need new parts."
                    rows="6"
                    className={`description-textarea ${errors.description ? 'error' : ''}`}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
                
                <div className="helper-tags">
                    <span className="helper-tag">💡 Be specific about the issue</span>
                    <span className="helper-tag">📏 Mention size if relevant</span>
                    <span className="helper-tag">🔧 List tools/parts needed</span>
                </div>
            </div>

            <div className="form-section">
                <label className="section-label">How urgent is this task?</label>
                <div className="urgency-grid">
                    {urgencyOptions.map(option => (
                        <label key={option.value} className="urgency-card">
                            <input
                                type="radio"
                                name="urgency"
                                value={option.value}
                                checked={formData.urgency === option.value}
                                onChange={(e) => handleChange('urgency', e.target.value)}
                                className="urgency-radio"
                            />
                            <div className="urgency-card-content">
                                <div className="urgency-icon">{option.icon}</div>
                                <h3>{option.label}</h3>
                                <p>{option.subtitle}</p>
                                {formData.urgency === option.value && (
                                    <div className="check-icon-urgency">✓</div>
                                )}
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 3: Review & Submit
    const renderStep3 = () => (
        <div className="step-content review-step">
            <div className="step-header">
                <h1>Review your request</h1>
                <p>Please verify the details below before posting your job.</p>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    ✓ Request created successfully! Redirecting...
                </div>
            )}

            <div className="review-sections">
                <div className="review-card">
                    <div className="review-icon">🔧</div>
                    <div className="review-content">
                        <h3>Service Type</h3>
                        <p>{categories.find(c => c.value === formData.category)?.label}</p>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="edit-btn">Edit</button>
                </div>

                <div className="review-card">
                    <div className="review-icon">📍</div>
                    <div className="review-content">
                        <h3>Location</h3>
                        <p>{formData.locationArea}</p>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="edit-btn">Edit</button>
                </div>

                <div className="review-card">
                    <div className="review-icon">⏰</div>
                    <div className="review-content">
                        <h3>Urgency</h3>
                        <p className="urgency-badge">
                            <span className={`urgency-dot ${formData.urgency.toLowerCase()}`}></span>
                            {urgencyOptions.find(u => u.value === formData.urgency)?.label}
                        </p>
                    </div>
                    <button onClick={() => setCurrentStep(2)} className="edit-btn">Edit</button>
                </div>

                <div className="review-card description-card">
                    <div className="review-icon">📝</div>
                    <div className="review-content">
                        <h3>Description</h3>
                        <p>{formData.description}</p>
                    </div>
                    <button onClick={() => setCurrentStep(2)} className="edit-btn">Edit</button>
                </div>
            </div>

            <div className="trust-panel">
                <h4>Why choose SkillLink?</h4>
                <div className="trust-items">
                    <div className="trust-item">
                        <span className="trust-icon">✓</span>
                        <span>Verified Pros</span>
                    </div>
                    <div className="trust-item">
                        <span className="trust-icon">🛡️</span>
                        <span>Insured Work</span>
                    </div>
                    <div className="trust-item">
                        <span className="trust-icon">💬</span>
                        <span>24/7 Support</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="page-wrapper">
            <Navbar variant="portal" />

            <div className="create-request-wizard">
                <div className="wizard-container">
                    {/* Left Sidebar - Info Panel */}
                    <div className="wizard-sidebar">
                        <div className="sidebar-content">
                            <h2>Let's get your task done.</h2>
                            <p>
                                Connecting you with trusted professionals across Sri Lanka. 
                                Tell us what you need, and we'll match you with the best experts for the job.
                            </p>
                        </div>
                        <div className="sidebar-footer">
                            © 2026 SkillLink Lanka Inc.
                        </div>
                    </div>

                    {/* Right Content - Form Area */}
                    <div className="wizard-main">
                        {/* Progress Stepper */}
                        <div className="stepper">
                            <div className="stepper-header">
                                <span className="step-label">Step {currentStep} of 3</span>
                                <div className="step-dots">
                                    <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}></div>
                                    <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}></div>
                                    <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Step Content */}
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}

                        {/* Navigation Buttons */}
                        <div className="wizard-actions">
                            {currentStep > 1 && (
                                <button onClick={handleBack} className="btn-back">
                                    ← Back
                                </button>
                            )}
                            
                            {currentStep < 3 ? (
                                <button onClick={handleNext} className="btn-next">
                                    Next Step →
                                </button>
                            ) : (
                                <button 
                                    onClick={handleSubmit} 
                                    className="btn-submit"
                                    disabled={loading || success}
                                >
                                    {loading ? 'Posting...' : success ? 'Posted!' : 'Post My Request'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateRequestPage;
