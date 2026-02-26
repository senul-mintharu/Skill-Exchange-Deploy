import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRequest, updateRequest } from '../../services/requestService';
import './CreateRequestPage.css';

/**
 * Multi-Step Request Creation Wizard
 * Step 1: Category & Location
 * Step 2: Details & Description
 * Step 3: Urgency & Review
 */
const CreateRequestPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we are in "Edit Mode"
    const isEditMode = location.state && location.state.requestToEdit;
    const requestToEdit = isEditMode ? location.state.requestToEdit : null;

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: requestToEdit?.title || '',
        category: requestToEdit?.category || '',
        locationArea: requestToEdit?.locationArea || '',
        description: requestToEdit?.description || '',
        urgency: requestToEdit?.urgency || 'MEDIUM',
        budget: requestToEdit?.budget || ''
    });

    const [errors, setErrors] = useState({});

    // Populate form if editing (effect for safety, though initial state handles most)
    useEffect(() => {
        if (isEditMode) {
             // Ensure step is set correctly if needed, or just let users flow through
        }
    }, [isEditMode]);

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
            if (!formData.title?.trim()) {
                newErrors.title = 'Title is required';
            } else if (formData.title.trim().length > 150) {
                newErrors.title = 'Title must not exceed 150 characters';
            }
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
            // Add budget validation if needed for step 2, or a new step
            // if (!formData.budget) newErrors.budget = 'Budget is required';
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
        // Final validation before submission
        if (!formData.title || !formData.description || !formData.locationArea || !formData.category || !formData.urgency) {
            setError('Please fill in all required details before submitting.');
            return;
        }
        if (!formData.budget) {
            setError('Please provide a budget for your request.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                category: formData.category,
                locationArea: formData.locationArea,
                description: formData.description,
                urgency: formData.urgency,
                budget: formData.budget
            };

            if (isEditMode) {
                await updateRequest(requestToEdit.id, payload);

                setSuccess(true);
                setTimeout(() => {
                    navigate(`/my-requests/${requestToEdit.id}`);
                }, 2000);
            } else {
                await createRequest(payload);

                setSuccess(true);
                setTimeout(() => {
                    navigate('/my-requests');
                }, 2000);
            }
        } catch (err) {
            console.error('Error creating/updating request:', err);
            setError(
                err.response?.data?.message ||
                `Failed to ${isEditMode ? 'update' : 'create'} request. Please try again.`
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
                <p>Give your request a title and select a category.</p>
            </div>

            <div className="form-section">
                <div className="label-row">
                    <label className="section-label" htmlFor="title">
                        Request Title
                    </label>
                    <span className="char-count">
                        {formData.title.length} / 150
                    </span>
                </div>
                <div className="title-input-wrapper">
                    <span className="input-icon">✏️</span>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="E.g., Fix leaking kitchen tap"
                        className={`title-input ${errors.title ? 'error' : ''}`}
                        maxLength={150}
                    />
                </div>
                {errors.title && <span className="error-message">{errors.title}</span>}
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

            {/* New Budget Input */}
            <div className="form-section">
                <label className="section-label" htmlFor="budget">
                    What is your budget for this task?
                </label>
                <div className="budget-input-wrapper">
                    <span className="input-icon">රු</span> {/* Sri Lankan Rupee symbol */}
                    <input
                        type="number"
                        id="budget"
                        value={formData.budget}
                        onChange={(e) => handleChange('budget', e.target.value)}
                        placeholder="Enter your budget (e.g., 5000)"
                        className={`budget-input ${errors.budget ? 'error' : ''}`}
                        min="0"
                    />
                </div>
                {errors.budget && <span className="error-message">{errors.budget}</span>}
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
                    ✓ Request {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
                </div>
            )}

            <div className="review-sections">
                <div className="review-card">
                    <div className="review-icon">✏️</div>
                    <div className="review-content">
                        <h3>Title</h3>
                        <p>{formData.title}</p>
                    </div>
                    <button onClick={() => setCurrentStep(1)} className="edit-btn">Edit</button>
                </div>

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

                {/* Display Budget in Review */}
                <div className="review-card">
                    <div className="review-icon">💰</div>
                    <div className="review-content">
                        <h3>Budget</h3>
                        <p>රු {formData.budget}</p>
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
                <h4>Why choose LankaFix?</h4>
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
                            © 2026 LankaFix Lanka Inc.
                        </div>
                    </div>

                    {/* Right Content - Form Area */}
                    <div className="wizard-main">
                        {/* Progress Stepper */}
                        <div className="cr-header-container">
                            <div className="cr-header">
                                <h1>{isEditMode ? 'Edit Your Request' : 'Post a New Request'}</h1>
                                <p>{isEditMode ? 'Update the details of your service request below.' : 'Tell us what you need, and we\'ll connect you with verified professionals.'}</p>
                            </div>

                            <div className="cr-steps">
                                <div className={`cr-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
                                <div className="cr-connector"></div>
                                <div className={`cr-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
                                <div className="cr-connector"></div>
                                <div className={`cr-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
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
                                    {loading ? (isEditMode ? 'Updating...' : 'Posting...') : success ? (isEditMode ? 'Updated!' : 'Posted!') : (isEditMode ? 'Update Request' : 'Post Request')}
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
