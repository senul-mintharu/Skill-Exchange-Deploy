import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRequestById } from '../../services/requestService';
import { createQuote } from '../../services/quoteService';
import { formatBudget, getCategoryIcon, formatCategoryLabel } from '../../utils/constants';
import './SubmitQuotePage.css';

/**
 * SubmitQuotePage — AC1, AC2, AC3, AC4
 *
 * HCI considerations:
 *  - Request summary card shown at top so the worker knows exactly what they're quoting on
 *  - Real-time character counter on the message textarea
 *  - Inline field-level validation with clear red error messages (AC3)
 *  - Submit button disabled while submitting to prevent double-clicks
 *  - Duplicate detection shown as a specific, non-alarming info banner (AC4)
 *  - Success state replaces the form with a confirmation card (AC2)
 *  - Budget guidance shown below the price field for context
 */
const SubmitQuotePage = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();

    // ── Data state ───────────────────────────────────────────────────────────
    const [request, setRequest] = useState(null);
    const [loadingRequest, setLoadingRequest] = useState(true);
    const [requestError, setRequestError] = useState('');

    // ── Form state ───────────────────────────────────────────────────────────
    const [price, setPrice] = useState('');
    const [estimatedDays, setEstimatedDays] = useState('');
    const [message, setMessage] = useState('');
    const MESSAGE_MAX = 1000;

    // ── UI state ─────────────────────────────────────────────────────────────
    const [errors, setErrors] = useState({});           // field-level errors
    const [submitError, setSubmitError] = useState(''); // global submit error
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedQuote, setSubmittedQuote] = useState(null);

    // ── Fetch request details ────────────────────────────────────────────────
    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const data = await getRequestById(requestId);
                setRequest(data);
            } catch (err) {
                setRequestError(
                    err.response?.status === 404
                        ? 'This service request no longer exists.'
                        : 'Failed to load request details. Please try again.'
                );
            } finally {
                setLoadingRequest(false);
            }
        };
        if (requestId) fetchRequest();
    }, [requestId]);

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = () => {
        const newErrors = {};

        if (!price || price === '') {
            newErrors.price = 'Please enter your quoted price.';
        } else if (isNaN(Number(price)) || Number(price) <= 0) {
            newErrors.price = 'Price must be a positive number.';
        }

        if (!estimatedDays || estimatedDays === '') {
            newErrors.estimatedDays = 'Please enter the estimated number of days.';
        } else if (!Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1) {
            newErrors.estimatedDays = 'Estimated days must be a whole number of at least 1.';
        }

        if (message.length > MESSAGE_MAX) {
            newErrors.message = `Message must be ${MESSAGE_MAX} characters or fewer.`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Clear a field error when the user starts typing
    const clearError = (field) => {
        if (errors[field]) {
            setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
        }
    };

    // ── Submit handler ───────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setIsDuplicate(false);

        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                requestId: Number(requestId),
                price: Number(price),
                estimatedDays: Number(estimatedDays),
                message: message.trim() || null,
            };

            // workerId defaults to 2 (seed worker) in quoteService until auth is wired
            const quote = await createQuote(payload);
            setSubmittedQuote(quote);
            setSubmitted(true);
        } catch (err) {
            const msg = err.response?.data?.message || '';
            if (msg.toLowerCase().includes('already submitted') || err.response?.status === 400 && msg.includes('already')) {
                setIsDuplicate(true);
            } else {
                setSubmitError(msg || 'Failed to submit your quotation. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // =========================================================================
    // Loading state — shimmer skeleton matching wrd- pattern
    // =========================================================================
    if (loadingRequest) {
        return (
            <div className="sq-wrapper">
                <main className="sq-container">
                    <div className="sq-skeleton-breadcrumb sq-skeleton-line" />
                    <div className="sq-card sq-skeleton-card">
                        <div className="sq-skeleton-line sq-sk-title" />
                        <div className="sq-skeleton-line sq-sk-sub" />
                        <div className="sq-skeleton-line sq-sk-meta" />
                    </div>
                    <div className="sq-card sq-skeleton-card">
                        <div className="sq-skeleton-line sq-sk-label" />
                        <div className="sq-skeleton-line sq-sk-input" />
                        <div className="sq-skeleton-line sq-sk-label" />
                        <div className="sq-skeleton-line sq-sk-input" />
                        <div className="sq-skeleton-line sq-sk-label" />
                        <div className="sq-skeleton-line sq-sk-textarea" />
                        <div className="sq-skeleton-line sq-sk-btn" />
                    </div>
                </main>
            </div>
        );
    }

    // =========================================================================
    // Request load error
    // =========================================================================
    if (requestError) {
        return (
            <div className="sq-wrapper">
                <div className="sq-error-state">
                    <div className="sq-error-card">
                        <span className="material-icons sq-error-icon">error_outline</span>
                        <h2>Couldn't Load Request</h2>
                        <p>{requestError}</p>
                        <Link to="/browse-requests" className="sq-btn sq-btn-primary">
                            <span className="material-icons">arrow_back</span>
                            Browse Requests
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // Success confirmation state (AC2)
    // =========================================================================
    if (submitted && submittedQuote) {
        return (
            <div className="sq-wrapper">
                <main className="sq-container">
                    <div className="sq-success-card">
                        <div className="sq-success-icon-wrap">
                            <span className="material-icons sq-success-icon">check_circle</span>
                        </div>
                        <h2 className="sq-success-title">Quotation Submitted!</h2>
                        <p className="sq-success-subtitle">
                            Your offer has been sent to the seeker. They'll review all quotations
                            and get back to you.
                        </p>

                        <div className="sq-success-summary">
                            <div className="sq-summary-row">
                                <span className="sq-summary-label">
                                    <span className="material-icons">payments</span> Your Price
                                </span>
                                <span className="sq-summary-value sq-price-highlight">
                                    LKR {Number(submittedQuote.price).toLocaleString()}
                                </span>
                            </div>
                            <div className="sq-summary-row">
                                <span className="sq-summary-label">
                                    <span className="material-icons">schedule</span> Estimated Time
                                </span>
                                <span className="sq-summary-value">
                                    {submittedQuote.estimatedDays} {submittedQuote.estimatedDays === 1 ? 'day' : 'days'}
                                </span>
                            </div>
                            <div className="sq-summary-row">
                                <span className="sq-summary-label">
                                    <span className="material-icons">assignment</span> Request
                                </span>
                                <span className="sq-summary-value">
                                    {request?.title || formatCategoryLabel(request?.category)}
                                </span>
                            </div>
                            <div className="sq-summary-row">
                                <span className="sq-summary-label">
                                    <span className="material-icons">pending</span> Status
                                </span>
                                <span className="sq-status-badge sq-status-pending">PENDING</span>
                            </div>
                        </div>

                        <div className="sq-success-actions">
                            <Link to="/browse-requests" className="sq-btn sq-btn-primary">
                                <span className="material-icons">search</span>
                                Browse More Requests
                            </Link>
                            <Link to={`/requests/${requestId}`} className="sq-btn sq-btn-outline">
                                <span className="material-icons">visibility</span>
                                Back to Request
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // =========================================================================
    // Main form
    // =========================================================================
    const budgetHint = request?.budget
        ? `Seeker's estimated budget: ${formatBudget(request.budget)}`
        : 'No budget specified — propose what you think is fair.';

    return (
        <div className="sq-wrapper">
            <main className="sq-container">

                {/* Breadcrumb */}
                <div className="sq-breadcrumb">
                    <Link to={`/requests/${requestId}`} className="sq-back-link">
                        <span className="material-icons">arrow_back</span>
                        Back to Request
                    </Link>
                </div>

                {/* ── Request Summary Card (AC1) ─────────────────────────── */}
                {request && (
                    <div className="sq-card sq-request-summary">
                        <div className="sq-summary-header">
                            <span className="sq-category-badge">
                                {getCategoryIcon(request.category)}&nbsp;{formatCategoryLabel(request.category)}
                            </span>
                            <span className={`sq-urgency-badge sq-urgency-${(request.urgency || 'medium').toLowerCase()}`}>
                                {request.urgency || 'MEDIUM'}
                            </span>
                        </div>
                        <h2 className="sq-request-title">
                            {request.title || formatCategoryLabel(request.category)}
                        </h2>
                        <p className="sq-request-description">{request.description}</p>
                        <div className="sq-request-meta">
                            <span className="sq-meta-chip">
                                <span className="material-icons">location_on</span>
                                {request.locationArea}
                            </span>
                            {request.budget && (
                                <span className="sq-meta-chip sq-meta-budget">
                                    <span className="material-icons">payments</span>
                                    Budget: {formatBudget(request.budget)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Duplicate warning (AC4) ───────────────────────────── */}
                {isDuplicate && (
                    <div className="sq-banner sq-banner-info" role="alert">
                        <span className="material-icons">info</span>
                        <div>
                            <strong>Already Submitted</strong>
                            <p>You've already submitted a quotation for this request. You can only send one quote per request.</p>
                        </div>
                    </div>
                )}

                {/* ── General submit error ──────────────────────────────── */}
                {submitError && (
                    <div className="sq-banner sq-banner-error" role="alert">
                        <span className="material-icons">error</span>
                        <div>
                            <strong>Submission Failed</strong>
                            <p>{submitError}</p>
                        </div>
                    </div>
                )}

                {/* ── Quotation Form Card ───────────────────────────────── */}
                <div className="sq-card sq-form-card">
                    <div className="sq-form-header">
                        <span className="material-icons sq-form-header-icon">request_quote</span>
                        <div>
                            <h3 className="sq-form-title">Submit Your Quotation</h3>
                            <p className="sq-form-subtitle">Fill in your price and availability to send your offer to the seeker.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="sq-form" id="submit-quote-form">

                        {/* Price field */}
                        <div className={`sq-field ${errors.price ? 'sq-field-error' : ''}`}>
                            <label htmlFor="sq-price" className="sq-label">
                                <span className="material-icons">payments</span>
                                Your Quoted Price (LKR) <span className="sq-required">*</span>
                            </label>
                            <div className="sq-input-wrap">
                                <span className="sq-input-prefix">LKR</span>
                                <input
                                    id="sq-price"
                                    type="number"
                                    min="1"
                                    step="50"
                                    className="sq-input sq-input-prefixed"
                                    placeholder="e.g. 3500"
                                    value={price}
                                    onChange={e => { setPrice(e.target.value); clearError('price'); }}
                                    aria-describedby="sq-price-hint sq-price-error"
                                    aria-invalid={!!errors.price}
                                />
                            </div>
                            <p id="sq-price-hint" className="sq-hint">{budgetHint}</p>
                            {errors.price && (
                                <p id="sq-price-error" className="sq-error-msg" role="alert">
                                    <span className="material-icons">warning</span>
                                    {errors.price}
                                </p>
                            )}
                        </div>

                        {/* Estimated Days field */}
                        <div className={`sq-field ${errors.estimatedDays ? 'sq-field-error' : ''}`}>
                            <label htmlFor="sq-eta" className="sq-label">
                                <span className="material-icons">schedule</span>
                                Estimated Completion Time (days) <span className="sq-required">*</span>
                            </label>
                            <div className="sq-input-wrap">
                                <input
                                    id="sq-eta"
                                    type="number"
                                    min="1"
                                    step="1"
                                    className="sq-input"
                                    placeholder="e.g. 2"
                                    value={estimatedDays}
                                    onChange={e => { setEstimatedDays(e.target.value); clearError('estimatedDays'); }}
                                    aria-describedby="sq-eta-hint sq-eta-error"
                                    aria-invalid={!!errors.estimatedDays}
                                />
                                <span className="sq-input-suffix">days</span>
                            </div>
                            <p id="sq-eta-hint" className="sq-hint">How many full days do you need to complete this job?</p>
                            {errors.estimatedDays && (
                                <p id="sq-eta-error" className="sq-error-msg" role="alert">
                                    <span className="material-icons">warning</span>
                                    {errors.estimatedDays}
                                </p>
                            )}
                        </div>

                        {/* Message / Proposal field (optional) */}
                        <div className={`sq-field ${errors.message ? 'sq-field-error' : ''}`}>
                            <label htmlFor="sq-message" className="sq-label">
                                <span className="material-icons">chat_bubble_outline</span>
                                Your Proposal <span className="sq-optional">(optional)</span>
                            </label>
                            <textarea
                                id="sq-message"
                                className="sq-textarea"
                                rows={5}
                                placeholder="Describe your approach, relevant experience, and why you're the right person for this job..."
                                value={message}
                                maxLength={MESSAGE_MAX}
                                onChange={e => { setMessage(e.target.value); clearError('message'); }}
                                aria-describedby="sq-message-counter sq-message-error"
                                aria-invalid={!!errors.message}
                            />
                            <div className="sq-textarea-footer">
                                {errors.message && (
                                    <p id="sq-message-error" className="sq-error-msg" role="alert">
                                        <span className="material-icons">warning</span>
                                        {errors.message}
                                    </p>
                                )}
                                <span
                                    id="sq-message-counter"
                                    className={`sq-char-counter ${message.length > MESSAGE_MAX * 0.9 ? 'sq-counter-warn' : ''}`}
                                >
                                    {message.length} / {MESSAGE_MAX}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="sq-form-actions">
                            <Link
                                to={`/requests/${requestId}`}
                                className="sq-btn sq-btn-ghost"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                id="sq-submit-btn"
                                className="sq-btn sq-btn-submit"
                                disabled={submitting || isDuplicate}
                                aria-busy={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="sq-spinner" aria-hidden="true" />
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <span className="material-icons">send</span>
                                        Submit Quotation
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tips sidebar-style card at the bottom */}
                <div className="sq-tips-card">
                    <h4 className="sq-tips-title">
                        <span className="material-icons">lightbulb</span>
                        Tips for a Winning Quote
                    </h4>
                    <ul className="sq-tips-list">
                        <li><span className="material-icons">check_circle</span> Price competitively — check similar jobs on the platform</li>
                        <li><span className="material-icons">check_circle</span> Be realistic with your timeline — under-promising beats over-promising</li>
                        <li><span className="material-icons">check_circle</span> Mention specific experience relevant to this category</li>
                        <li><span className="material-icons">check_circle</span> Keep your proposal professional and concise</li>
                    </ul>
                </div>

            </main>
        </div>
    );
};

export default SubmitQuotePage;
