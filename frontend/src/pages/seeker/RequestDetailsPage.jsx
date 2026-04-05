import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import ErrorBanner from '../../components/common/ErrorBanner';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  SectionCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { deleteRequest, getRequestById, updateRequestStatus } from '../../services/requestService';
import { getQuotesByRequest } from '../../services/quoteService';
import { getMyReviews, submitReview } from '../../services/reviewService';
import { submitDispute } from '../../services/disputeService';
import { formatBudget, formatCategoryLabel } from '../../utils/constants';

const getJobStatusLabel = (status) => {
  if (status === 'ASSIGNED') return 'Assigned';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'COMPLETED') return 'Completed';
  return String(status || '').replaceAll('_', ' ');
};

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'OPEN') return 'info';
  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'NOT_COMPLETED' || normalized === 'CANCELLED') return 'danger';
  return 'neutral';
};

const metricAccent = (tone) => {
  if (tone === 'success') return 'border-green-100 bg-green-50/80';
  if (tone === 'warning') return 'border-amber-100 bg-amber-50/80';
  if (tone === 'danger') return 'border-red-100 bg-red-50/80';
  return 'border-blue-100 bg-blue-50/75';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Recently';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const buildTimeline = (request, quoteCount) => {
  const status = String(request.status || '').toUpperCase();
  const hasAssignment = status === 'ASSIGNED' || status === 'IN_PROGRESS' || status === 'COMPLETED';

  return [
    {
      title: 'Request Posted',
      detail: formatDate(request.createdAt),
      completed: true,
    },
    {
      title: quoteCount > 0 ? `${quoteCount} Quote${quoteCount === 1 ? '' : 's'} Received` : 'Waiting for Quotes',
      detail: quoteCount > 0 ? 'Workers have responded to your request.' : 'No quotations yet.',
      completed: quoteCount > 0,
    },
    {
      title: hasAssignment ? 'Worker Selected' : 'Select a Worker',
      detail: hasAssignment
        ? request.assignedWorkerName || 'A worker has been assigned.'
        : 'Review quotations to choose the right professional.',
      completed: hasAssignment,
    },
    {
      title: status === 'COMPLETED' ? 'Job Completed' : 'Finish the Job',
      detail: status === 'COMPLETED'
        ? 'This request has been marked as completed.'
        : 'Mark the outcome when the work is done.',
      completed: status === 'COMPLETED',
    },
  ];
};

const previewDescription = (text) => {
  if (!text) return 'No additional description was provided.';
  return text;
};

const StarRatingInput = ({ value, onChange, disabled }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        disabled={disabled}
        className={`text-3xl transition-colors ${star <= (value || 0) ? 'text-amber-400' : 'text-gray-300'} hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-60`}
        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
      >
        <span className="material-icons">star</span>
      </button>
    ))}
    <span className="ml-2 text-sm font-semibold text-ink-muted">{value ? `${value} / 5` : 'Select rating'}</span>
  </div>
);

const StarRatingDisplay = ({ rating }) => {
  const normalized = Math.min(5, Math.max(1, Number(rating) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5" aria-label={`${normalized} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`material-icons text-lg ${i < normalized ? 'text-amber-400' : 'text-gray-300'}`}
          >
            star
          </span>
        ))}
      </div>
      <span className="text-sm font-semibold text-ink-muted">{normalized}/5</span>
    </div>
  );
};

const RequestDetailsPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isWorker = !location.pathname.startsWith('/my-requests');
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState('');

  // Review form state
  const [reviewRating, setReviewRating] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [existingReview, setExistingReview] = useState(null);

  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  const fetchRequestDetails = useCallback(async (showLoading = true) => {
    if (!requestId) return;
    if (showLoading) setLoading(true);

    try {
      const data = await getRequestById(requestId);
      setRequest(data);
      setError('');
    } catch (err) {
      if (err.response?.status === 404) {
        setError('This request was not found. It may have been removed.');
      } else {
        setError('Failed to load request details. Please try again.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [requestId]);

  const fetchQuotes = useCallback(async () => {
    if (!requestId || isWorker) return;
    setQuotesLoading(true);
    setQuotesError('');
    try {
      const data = await getQuotesByRequest(Number(requestId));
      setQuotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setQuotesError(err.response?.data?.message || 'Failed to load quotations. Please try again.');
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  }, [isWorker, requestId]);

  useEffect(() => {
    if (requestId) {
      fetchRequestDetails(true);
    }
  }, [fetchRequestDetails, requestId]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const loadExistingReview = useCallback(async () => {
    if (!requestId || isWorker || String(request?.status || '').toUpperCase() !== 'COMPLETED') return;
    try {
      const reviews = await getMyReviews();
      const matched = (Array.isArray(reviews) ? reviews : []).find(
        (review) => Number(review.requestId) === Number(requestId),
      );
      setExistingReview(matched || null);
      if (matched) {
        setReviewRating(matched.rating);
        setReviewComment(matched.comment || '');
      }
    } catch {
      // Ignore lookup failures to avoid interrupting request details page load.
    }
  }, [isWorker, request?.status, requestId]);

  useEffect(() => {
    loadExistingReview();
  }, [loadExistingReview]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewRating) {
      setReviewError('Please select a star rating to submit your review');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    try {
      const createdReview = await submitReview({ requestId: Number(requestId), rating: reviewRating, comment: reviewComment });
      setExistingReview({
        ...createdReview,
        rating: createdReview?.rating ?? reviewRating,
        comment: createdReview?.comment ?? reviewComment,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit review. Please try again.';
      setReviewError(message);
      if (err.response?.status === 409 || message.toLowerCase().includes('already submitted')) {
        await loadExistingReview();
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      setDisputeMessage('Please provide a reason for the dispute.');
      return;
    }
    setDisputeSubmitting(true);
    setDisputeMessage('');
    try {
      await submitDispute({ requestId: Number(requestId), reason: disputeReason });
      setDisputeMessage('Dispute submitted successfully. Our team will review it shortly.');
      setDisputeSubmitted(true);
    } catch (err) {
      setDisputeMessage(err.response?.data?.message || 'Failed to submit dispute. Please try again.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const handleUpdateJobOutcome = async (status) => {
    const statusLabel = status === 'COMPLETED' ? 'Completed' : 'Not Completed';
    const confirmed = window.confirm(`Are you sure you want to mark this job as ${statusLabel}?`);
    if (!confirmed) return;

    setIsUpdatingStatus(true);
    setStatusUpdateMessage('');

    try {
      await updateRequestStatus(request.id, status);
      setStatusUpdateMessage(`Job marked as ${statusLabel} successfully.`);
      await fetchRequestDetails(false);
    } catch (err) {
      setStatusUpdateMessage(err.response?.data?.message || 'Failed to update job status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const timeline = useMemo(() => {
    if (!request) return [];
    return buildTimeline(request, quotes.length);
  }, [quotes.length, request]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <main className="ui-shell">
          <LoadingPanel message="Loading request details..." />
        </main>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="page-wrapper">
        <main className="ui-shell">
          <EmptyState
            icon="error_outline"
            title="Something went wrong"
            text={error || 'Request not found'}
            action={(
              <Link to={isWorker ? '/browse-requests' : '/my-requests'} className="ui-button-primary">
                {isWorker ? 'Back to Browse Requests' : 'Back to My Requests'}
              </Link>
            )}
          />
        </main>
      </div>
    );
  }

  const tone = statusTone(request.status);
  const accentClass = metricAccent(tone);

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-4">
        <Breadcrumb />

        <Link to={isWorker ? '/browse-requests' : '/my-requests'} className="ui-link text-white">
          <span className="material-icons text-base">arrow_back</span>
          {isWorker ? 'Back to Browse Requests' : 'Back to My Requests'}
        </Link>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_320px]">
          <section className="space-y-5">
            <section className="ui-panel overflow-hidden p-0">
              <div className={`border-b px-4 py-3 sm:px-5 ${accentClass}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ui-badge">{formatCategoryLabel(request.category)}</span>
                      <span className="ui-badge-muted">#{request.id}</span>
                      <span className="ui-badge-muted">Posted {formatDate(request.createdAt)}</span>
                    </div>
                    <div>
                      <h1 className="font-display text-2xl font-extrabold tracking-snugger text-ink md:text-3xl">
                        {request.title || formatCategoryLabel(request.category)}
                      </h1>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
                        Review the current job status, scope, and worker progress from one place.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:max-w-[320px] lg:justify-end">
                    <StatusPill tone={tone} className="w-fit">
                      {getJobStatusLabel(request.status)}
                    </StatusPill>
                    {!isWorker ? (
                      <>
                        <button
                          className="ui-button-secondary w-full sm:w-auto"
                          onClick={() => navigate('/create-request', { state: { requestToEdit: request } })}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="ui-button-danger w-full sm:w-auto"
                          type="button"
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
                              return;
                            }
                            try {
                              await deleteRequest(request.id);
                              navigate('/my-requests');
                            } catch (err) {
                              setError('Failed to delete request.');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button className="ui-button-primary w-full sm:w-auto" onClick={() => navigate(`/requests/${request.id}/quote`)} type="button">
                        Send Quote
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-2 xl:grid-cols-4">
                <div className={`rounded-card border px-4 py-3 shadow-soft ${accentClass}`}>
                  <p className="ui-stat-label">Urgency</p>
                  <p className="mt-2 text-base font-bold text-ink sm:text-lg">{String(request.urgency || 'MEDIUM').replaceAll('_', ' ')}</p>
                </div>
                <div className={`rounded-card border px-4 py-3 shadow-soft ${accentClass}`}>
                  <p className="ui-stat-label">Budget</p>
                  <p className="mt-2 text-base font-bold text-ink sm:text-lg">{formatBudget(request.budget)}</p>
                </div>
                <div className={`rounded-card border px-4 py-3 shadow-soft ${accentClass}`}>
                  <p className="ui-stat-label">Location</p>
                  <p className="mt-2 text-base font-bold text-ink sm:text-lg">{request.locationArea || 'Not set'}</p>
                </div>
                <div className={`rounded-card border px-4 py-3 shadow-soft ${accentClass}`}>
                  <p className="ui-stat-label">{isWorker ? 'Request Status' : 'Quotes Received'}</p>
                  <p className="mt-2 text-base font-bold text-ink sm:text-lg">{isWorker ? getJobStatusLabel(request.status) : quotes.length}</p>
                </div>
              </div>
            </section>

            <SectionCard className="border-line-strong bg-white shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="ui-stat-label">Scope</p>
                  <h2 className="mt-2 text-xl font-bold text-ink">Request Description</h2>
                </div>
                <span className="ui-badge-muted">Category: {formatCategoryLabel(request.category)}</span>
              </div>
              <div className="mt-4 rounded-card border border-line bg-surface-muted/70 px-4 py-4">
                <p className="text-sm leading-7 text-ink-soft">{previewDescription(request.description)}</p>
              </div>
            </SectionCard>

            <SectionCard className="border-line-strong bg-white shadow-card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="ui-stat-label">Assignment</p>
                  <h2 className="mt-2 text-xl font-bold text-ink">Assigned Worker & Job Status</h2>
                </div>
                <StatusPill tone={tone}>{getJobStatusLabel(request.status)}</StatusPill>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-card border border-line bg-surface-muted/75 px-4 py-4 shadow-soft">
                  <p className="ui-stat-label">Assigned Worker</p>
                  <div className="mt-3">
                    {request.assignedWorkerId ? (
                      <Link to={`/workers/${request.assignedWorkerId}`} className="text-lg font-bold text-brand-800 hover:text-brand-900">
                        {request.assignedWorkerName || `Worker #${request.assignedWorkerId}`}
                      </Link>
                    ) : (
                      <p className="text-lg font-bold text-ink-muted">No worker assigned yet</p>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {request.assignedWorkerId
                      ? 'Open the worker profile to review credentials and service details.'
                      : 'Once you accept a quotation, the selected worker will appear here.'}
                  </p>
                </div>

                <div className="rounded-card border border-line bg-surface-muted/75 px-4 py-4 shadow-soft">
                  <p className="ui-stat-label">Current Job Status</p>
                  <div className="mt-3">
                    <StatusPill tone={tone}>{getJobStatusLabel(request.status)}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-muted">
                    {request.status === 'COMPLETED'
                      ? 'This job has already been completed successfully.'
                      : request.status === 'ASSIGNED' || request.status === 'IN_PROGRESS'
                        ? 'Use the controls below when the work is finished or needs a status update.'
                        : 'The request is still waiting for the next action.'}
                  </p>
                </div>
              </div>

              {!isWorker && request.status === 'ASSIGNED' ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row">
                  <button className="ui-button-primary flex-1" onClick={() => handleUpdateJobOutcome('COMPLETED')} disabled={isUpdatingStatus} type="button">
                    Mark as Completed
                  </button>
                  <button className="ui-button-secondary flex-1" onClick={() => handleUpdateJobOutcome('NOT_COMPLETED')} disabled={isUpdatingStatus} type="button">
                    Mark as Not Completed
                  </button>
                </div>
              ) : null}

              {statusUpdateMessage ? (
                <div className="mt-4">
                  <AlertPanel
                    tone={statusUpdateMessage.toLowerCase().includes('successfully') ? 'success' : 'danger'}
                    icon={statusUpdateMessage.toLowerCase().includes('successfully') ? 'check_circle' : 'error_outline'}
                  >
                    <p>{statusUpdateMessage}</p>
                  </AlertPanel>
                </div>
              ) : null}
            </SectionCard>

            {/* SCRUM-94: Review submission — only visible to the seeker who owns this request, after COMPLETED */}
            {!isWorker && request.status === 'COMPLETED' ? (
              <SectionCard className="border-green-100 bg-white shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="ui-stat-label">Feedback</p>
                    <h2 className="mt-2 text-xl font-bold text-ink">Leave a Review</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      Share your experience with the worker to help others make informed decisions.
                    </p>
                  </div>
                  <span className="material-icons text-4xl text-green-500">star_rate</span>
                </div>

                {existingReview ? (
                  <div className="mt-5 space-y-4 rounded-card border border-line bg-surface-muted/70 px-4 py-4">
                    <div>
                      <p className="ui-stat-label mb-2 block">Your Rating</p>
                      <StarRatingDisplay rating={existingReview.rating} />
                    </div>

                    <div>
                      <p className="ui-stat-label mb-2 block">Your Comment</p>
                      {existingReview.comment ? (
                        <p className="rounded-card border border-line bg-white px-4 py-3 text-sm leading-6 text-ink">
                          {existingReview.comment}
                        </p>
                      ) : (
                        <p className="rounded-card border border-dashed border-line bg-white px-4 py-3 text-sm italic text-ink-muted">
                          No written feedback provided.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="mt-5 space-y-4">
                    {/* Star Rating */}
                    <div>
                      <label className="ui-stat-label mb-2 block">Rating</label>
                      <StarRatingInput value={reviewRating} onChange={setReviewRating} disabled={reviewSubmitting} />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="ui-stat-label mb-2 block" htmlFor="review-comment">
                        Comment <span className="font-normal text-ink-muted">(optional)</span>
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe your experience with the worker..."
                        className="w-full rounded-card border border-line bg-surface-muted/70 px-4 py-3 text-sm text-ink placeholder-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>

                    <ErrorBanner message={reviewError} />

                    <button
                      type="submit"
                      disabled={reviewSubmitting || Boolean(existingReview)}
                      className="ui-button-primary w-full sm:w-auto"
                    >
                      {reviewSubmitting ? (
                        <>
                          <span className="material-icons animate-spin text-base">refresh</span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-base">star</span>
                          Submit Review
                        </>
                      )}
                    </button>
                  </form>
                )}
              </SectionCard>
            ) : null}

            {/* SCRUM-94: Dispute submission — only visible to the seeker who owns this request, after NOT_COMPLETED */}
            {!isWorker && request.status === 'NOT_COMPLETED' ? (
              <SectionCard className="border-red-100 bg-white shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="ui-stat-label">Issue Resolution</p>
                    <h2 className="mt-2 text-xl font-bold text-ink">Raise a Dispute</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      If the job was not completed satisfactorily, submit a dispute for admin review.
                    </p>
                  </div>
                  <span className="material-icons text-4xl text-red-400">report_problem</span>
                </div>

                {disputeSubmitted ? (
                  <div className="mt-4">
                    <AlertPanel tone="success" icon="check_circle" title="Dispute Submitted">
                      <p>{disputeMessage}</p>
                    </AlertPanel>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitDispute} className="mt-5 space-y-4">
                    <div>
                      <label className="ui-stat-label mb-2 block" htmlFor="dispute-reason">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="dispute-reason"
                        rows={4}
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Explain why the job was not completed as expected..."
                        required
                        className="w-full rounded-card border border-line bg-surface-muted/70 px-4 py-3 text-sm text-ink placeholder-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>

                    {disputeMessage ? (
                      <AlertPanel
                        tone={disputeMessage.toLowerCase().includes('successfully') ? 'success' : 'danger'}
                        icon={disputeMessage.toLowerCase().includes('successfully') ? 'check_circle' : 'error_outline'}
                      >
                        <p>{disputeMessage}</p>
                      </AlertPanel>
                    ) : null}

                    <button
                      type="submit"
                      disabled={disputeSubmitting}
                      className="ui-button-primary w-full sm:w-auto"
                    >
                      {disputeSubmitting ? (
                        <>
                          <span className="material-icons animate-spin text-base">refresh</span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-base">report</span>
                          Submit Dispute
                        </>
                      )}
                    </button>
                  </form>
                )}
              </SectionCard>
            ) : null}

            {!isWorker ? (
              <SectionCard className="border-line-strong bg-white shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="ui-stat-label">Responses</p>
                    <h2 className="mt-2 text-xl font-bold text-ink">Quotes Received</h2>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      Scan the latest quotations here, then open the compare view for the full decision workflow.
                    </p>
                  </div>
                  <Link to={`/my-requests/${requestId}/quotations`} className="ui-button-secondary w-full sm:w-auto">
                    View All Quotations
                  </Link>
                </div>

                <div className="mt-5">
                  {quotesLoading ? <LoadingPanel message="Loading quotations…" /> : null}

                  {!quotesLoading && quotesError ? (
                    <AlertPanel tone="danger" icon="error_outline" title="Couldn’t load quotations">
                      <p>{quotesError}</p>
                    </AlertPanel>
                  ) : null}

                  {!quotesLoading && !quotesError && quotes.length === 0 ? (
                    <EmptyState
                      icon="schedule"
                      title="No quotations received yet"
                      text="Workers haven’t submitted quotations for this request yet. Please check back soon."
                      className="max-w-full"
                    />
                  ) : null}

                  {!quotesLoading && !quotesError && quotes.length > 0 ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {quotes.map((quote) => (
                        <article key={quote.id} className="rounded-card border border-line bg-surface-muted/75 p-4 shadow-soft">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                                {(quote.workerName || 'W').charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                {quote.workerProfileId ? (
                                  <Link to={`/workers/${quote.workerProfileId}`} className="block truncate text-lg font-bold text-brand-800 hover:text-brand-900">
                                    {quote.workerName || `Worker #${quote.workerId}`}
                                  </Link>
                                ) : (
                                  <p className="truncate text-lg font-bold text-ink">
                                    {quote.workerName || `Worker #${quote.workerId}`}
                                  </p>
                                )}
                                <p className="text-sm text-ink-muted">Quote #{quote.id}</p>
                              </div>
                            </div>
                            <StatusPill tone="info">Received</StatusPill>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-card border border-blue-100 bg-blue-50/75 px-4 py-3">
                              <p className="ui-stat-label">Price</p>
                              <p className="mt-2 text-base font-bold text-blue-900 sm:text-lg">LKR {Number(quote.price).toLocaleString()}</p>
                            </div>
                            <div className="rounded-card border border-amber-100 bg-amber-50/75 px-4 py-3">
                              <p className="ui-stat-label">ETA</p>
                              <p className="mt-2 text-base font-bold text-amber-900 sm:text-lg">
                                {quote.estimatedDays} {quote.estimatedDays === 1 ? 'day' : 'days'}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}
          </section>

          <aside className="space-y-5">
            <SectionCard className="border-brand-100 bg-white shadow-card">
              <p className="ui-stat-label">Timeline</p>
              <h2 className="mt-2 text-xl font-bold text-ink">Request Progress</h2>
              <div className="mt-4 space-y-3">
                {timeline.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.completed ? 'bg-brand-gradient text-white' : 'bg-brand-50 text-brand-800'}`}>
                      {item.completed ? '✓' : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-muted">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard className="overflow-hidden border-brand-100 bg-white !p-0 shadow-card">
              <div className="h-36 bg-slate-200 sm:h-44">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlr0JM-MPQoAegLZS8W5LRqAinPbVNOYG4ZUju8ufz_vQLUtBcrad_uK9K3ujh9j4DHa8-Za85pg4sCDAOEnnw6xvVfgWitViKwAF90TCJGJ5_xgPLIRczXRB-QpjrpDzerBjh6ABsAlpD8ogpDkHsVhcHWKysFeD1SyuxpFeVU_R71wQT4KtNrUsfj9mb7Bbz8gpSfFQQm7Ia-jcUmfNl6kt3MJLVGggG2b7A2xw4L8My4yMCyH7oYR-Y6iaSf9mXsUeDWSCOX8c"
                  alt="Map"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-3 p-4">
                <p className="ui-stat-label">Service Location</p>
                <p className="text-lg font-bold text-ink">{request.locationArea || 'Location not set'}</p>
                <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
                  <span className="material-icons text-base text-brand-700">verified_user</span>
                  Professionals in this area can view and respond to your request.
                </p>
              </div>
            </SectionCard>

            {!isWorker ? (
              <AlertPanel tone="info" icon="support_agent" title="Need Help?">
                <p>Our support team is available 24/7 to help you understand quotes, assignments, and next steps.</p>
              </AlertPanel>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default RequestDetailsPage;
