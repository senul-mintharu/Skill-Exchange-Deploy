import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRequestById } from '../../services/requestService';
import { createQuote } from '../../services/quoteService';
import { formatBudget, formatCategoryLabel, getCategoryIcon } from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/formValidationMessages';
import { AlertPanel, EmptyState, LoadingPanel, PageIntro, StatusPill } from '../../components/ui/PortalPrimitives';
import { useToast } from '../../components/common/ToastContext';

const SubmitQuotePage = () => {
  const { requestId } = useParams();
  const toast = useToast();
  const [request, setRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [requestError, setRequestError] = useState('');
  const [price, setPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState(null);
  const messageLimit = 1000;

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

    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const validate = () => {
    const nextErrors = {};

    if (!price) nextErrors.price = 'Please enter your quoted price.';
    else if (Number.isNaN(Number(price))) nextErrors.price = 'Price must be a valid number.';
    else if (Number(price) < 0) nextErrors.price = 'Price cannot be negative. Please enter a positive amount.';
    else if (Number(price) === 0) nextErrors.price = 'Price must be greater than zero.';

    if (!estimatedDays) nextErrors.estimatedDays = 'Please enter the estimated number of days.';
    else if (!Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1) {
      nextErrors.estimatedDays = 'Estimated days must be a whole number of at least 1.';
    }

    if (message.length > messageLimit) {
      nextErrors.message = `Message must be ${messageLimit} characters or fewer.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setIsDuplicate(false);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const quote = await createQuote({
        requestId: Number(requestId),
        price: Number(price),
        estimatedDays: Number(estimatedDays),
        message: message.trim() || null,
      });

      setSubmittedQuote(quote);
      setSubmitted(true);

      // Reset form fields
      setPrice('');
      setEstimatedDays('');
      setMessage('');
      setErrors({});
      setSubmitError('');

      // Fire global success toast
      toast.success(
        `Quotation of LKR ${Number(quote.price).toLocaleString()} submitted successfully!`,
        { title: 'Quote Sent' },
      );
    } catch (err) {
      const responseMessage = err.response?.data?.message || '';
      const duplicateSubmission = responseMessage.toLowerCase().includes('already submitted') ||
        (err.response?.status === 400 && responseMessage.toLowerCase().includes('already'));

      if (duplicateSubmission) {
        setIsDuplicate(true);
        toast.warning('You have already submitted a quote for this request.');
      } else {
        setSubmitError(
          getApiErrorMessage(
            err,
            'We could not submit your quotation. Check the numbers and your proposal, then try again.',
          ),
        );
        toast.error('Quotation submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRequest) {
    return (
      <div className="page-wrapper">
        <main className="ui-shell">
          <LoadingPanel message="Loading request details..." />
        </main>
      </div>
    );
  }

  if (requestError) {
    return (
      <div className="page-wrapper">
        <main className="ui-shell">
          <EmptyState
            icon="error_outline"
            title="Couldn’t Load Request"
            text={requestError}
            action={<Link to="/browse-requests" className="ui-button-primary">Browse Requests</Link>}
          />
        </main>
      </div>
    );
  }

  if (submitted && submittedQuote) {
    return (
      <div className="page-wrapper">
        <main className="ui-shell">
          <section className="ui-panel mx-auto max-w-3xl p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
              <span className="material-icons text-5xl">check_circle</span>
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-ink">Quotation Submitted!</h1>
            <p className="mt-4 text-sm leading-7 text-ink-muted">
              Your offer has been sent to the seeker. They&apos;ll review all quotations and get back to you.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-card border border-line bg-white p-5 text-left">
                <p className="ui-stat-label">Your Price</p>
                <p className="mt-2 text-2xl font-extrabold text-brand-800">
                  LKR {Number(submittedQuote.price).toLocaleString()}
                </p>
              </div>
              <div className="rounded-card border border-line bg-white p-5 text-left">
                <p className="ui-stat-label">Estimated Time</p>
                <p className="mt-2 text-2xl font-extrabold text-ink">
                  {submittedQuote.estimatedDays} {submittedQuote.estimatedDays === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div className="rounded-card border border-line bg-white p-5 text-left">
                <p className="ui-stat-label">Request</p>
                <p className="mt-2 text-lg font-bold text-ink">
                  {request?.title || formatCategoryLabel(request?.category)}
                </p>
              </div>
              <div className="rounded-card border border-line bg-white p-5 text-left">
                <p className="ui-stat-label">Status</p>
                <div className="mt-2">
                  <StatusPill tone="warning">PENDING</StatusPill>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/browse-requests" className="ui-button-primary">
                Browse More Requests
              </Link>
              <Link to={`/requests/${requestId}`} className="ui-button-secondary">
                Back to Request
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const budgetHint = request?.budget
    ? `Seeker's estimated budget: ${formatBudget(request.budget)}`
    : 'No budget specified — propose what you think is fair.';

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <section className="ui-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <Link to={`/requests/${requestId}`} className="ui-link">
              <span className="material-icons text-base">arrow_back</span>
              Back to Request
            </Link>
            <PageIntro
              eyebrow="Worker Quotation"
              title="Submit Quote"
              subtitle="Send a confident, realistic offer with a clear timeline and a short explanation of how you will handle the work."
              className="mb-0"
            />
          </div>
        </section>

        {request ? (
          <section className="ui-panel p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="ui-badge">
                {getCategoryIcon(request.category)} {formatCategoryLabel(request.category)}
              </span>
              <StatusPill tone={request.urgency === 'URGENT' ? 'danger' : request.urgency === 'HIGH' ? 'warning' : 'info'}>
                {request.urgency || 'MEDIUM'}
              </StatusPill>
            </div>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-snugger text-ink">
              {request.title || formatCategoryLabel(request.category)}
            </h1>
            <p className="mt-4 text-sm leading-7 text-ink-muted">{request.description}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="ui-badge-muted">
                <span className="material-icons text-base">location_on</span>
                {request.locationArea}
              </span>
              {request.budget ? (
                <span className="ui-badge-muted">
                  <span className="material-icons text-base">payments</span>
                  Budget: {formatBudget(request.budget)}
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        {isDuplicate ? (
          <AlertPanel tone="info" icon="info" title="Already Submitted">
            <p>You&apos;ve already submitted a quotation for this request. You can only send one quote per request.</p>
          </AlertPanel>
        ) : null}

        {submitError ? (
          <AlertPanel tone="danger" icon="error" title="Submission Failed">
            <p>{submitError}</p>
          </AlertPanel>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          <section className="ui-card p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                <span className="material-icons">request_quote</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink">Submit Your Quotation</h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  Fill in your price and availability to send your offer to the seeker.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div className="ui-field">
                <label htmlFor="price" className="ui-label">Your Quoted Price (LKR)</label>
                <div className={`ui-input-icon-wrap ${errors.price ? 'ring-2 ring-red-400/50 border-red-300' : ''}`}>
                  <span className="text-sm font-semibold text-ink-subtle">LKR</span>
                  <input
                    id="price"
                    type="number"
                    min="1"
                    step="50"
                    value={price}
                    onChange={(event) => {
                      const val = event.target.value;
                      setPrice(val);

                      // Inline validation — give instant feedback
                      if (val === '') {
                        clearFieldError('price');
                      } else if (Number.isNaN(Number(val))) {
                        setErrors((prev) => ({ ...prev, price: 'Price must be a valid number.' }));
                      } else if (Number(val) < 0) {
                        setErrors((prev) => ({ ...prev, price: 'Price cannot be negative. Please enter a positive amount.' }));
                      } else if (Number(val) === 0) {
                        setErrors((prev) => ({ ...prev, price: 'Price must be greater than zero.' }));
                      } else {
                        clearFieldError('price');
                      }
                    }}
                    placeholder="e.g. 3500"
                  />
                </div>
                <p className="ui-helper">{budgetHint}</p>
                {errors.price ? (
                  <p className="ui-error-text flex items-center gap-1.5">
                    <span className="material-icons text-sm">warning_amber</span>
                    {errors.price}
                  </p>
                ) : null}
              </div>

              <div className="ui-field">
                <label htmlFor="estimatedDays" className="ui-label">Estimated Completion Time (days)</label>
                <div className="ui-input-icon-wrap">
                  <input
                    id="estimatedDays"
                    type="number"
                    min="1"
                    step="1"
                    value={estimatedDays}
                    onChange={(event) => {
                      setEstimatedDays(event.target.value);
                      clearFieldError('estimatedDays');
                    }}
                    placeholder="e.g. 2"
                  />
                  <span className="text-sm font-semibold text-ink-subtle">days</span>
                </div>
                <p className="ui-helper">How many full days do you need to complete this job?</p>
                {errors.estimatedDays ? <p className="ui-error-text">{errors.estimatedDays}</p> : null}
              </div>

              <div className="ui-field">
                <label htmlFor="message" className="ui-label">Your Proposal</label>
                <textarea
                  id="message"
                  className="ui-textarea"
                  rows={5}
                  placeholder="Describe your approach, relevant experience, and why you're the right person for this job..."
                  value={message}
                  maxLength={messageLimit}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    clearFieldError('message');
                  }}
                />
                <div className="flex items-center justify-between gap-3">
                  {errors.message ? <p className="ui-error-text">{errors.message}</p> : <span />}
                  <span className={`text-xs font-semibold ${message.length > messageLimit * 0.9 ? 'text-warning' : 'text-ink-subtle'}`}>
                    {message.length} / {messageLimit}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to={`/requests/${requestId}`} className="ui-button-ghost flex-1">
                  Cancel
                </Link>
                <button type="submit" className="ui-button-primary flex-1" disabled={submitting || isDuplicate}>
                  {submitting ? 'Submitting...' : 'Submit Quotation'}
                </button>
              </div>
            </form>
          </section>

          <aside className="ui-card p-5">
            <h3 className="text-xl font-bold text-ink">Tips for a Winning Quote</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-muted">
              {[
                'Price competitively and stay within the expected range.',
                'Be realistic with your timeline and note any dependencies.',
                'Mention experience that is directly relevant to this category.',
                'Keep your proposal professional and concise.',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="material-icons mt-0.5 text-base text-brand-700">check_circle</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SubmitQuotePage;
