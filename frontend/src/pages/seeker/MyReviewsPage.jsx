import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyReviews } from '../../services/reviewService';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
} from '../../components/ui/PortalPrimitives';

/**
 * StarRating — renders filled/empty stars for a 1–5 rating.
 */
const StarRating = ({ rating }) => {
  const clamped = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <span className="flex items-center gap-0.5" aria-label={`${clamped} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`material-icons text-lg ${i < clamped ? 'text-amber-400' : 'text-gray-200'}`}
        >
          star
        </span>
      ))}
    </span>
  );
};

/**
 * Formats an ISO date string to a human-readable date.
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * MyReviewsPage — SCRUM-87
 *
 * Displays all reviews submitted by the authenticated seeker.
 * AC1: Lists worker name, star rating, feedback text, submission date.
 * AC2: Shows empty state when no reviews exist.
 * AC3: Reviews are displayed in reverse chronological order (most recent first — enforced by backend).
 */
const MyReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load your reviews. Please try again.'
      );
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const hasReviews = reviews.length > 0;

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <PageIntro
          eyebrow="My Reviews"
          title="Reviews You've Submitted"
          subtitle="A record of all feedback you have left for workers after completed jobs. Your reviews help maintain quality and trust on the platform."
          light
          actions={
            <Link to="/my-requests" className="ui-button-secondary w-full sm:w-auto">
              <span className="material-icons text-base">arrow_back</span>
              Back to My Requests
            </Link>
          }
        />

        {loading ? <LoadingPanel message="Loading your reviews..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn't load your reviews"
            action={
              <button onClick={loadReviews} className="ui-button-primary" type="button">
                Try Again
              </button>
            }
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && !hasReviews ? (
          <EmptyState
            icon="rate_review"
            title="No reviews yet"
            text="You have not submitted any reviews yet. After a job is completed, you can leave feedback for the worker from your request details page."
            action={
              <Link to="/my-requests" className="ui-button-primary">
                View My Requests
              </Link>
            }
          />                                                    
        ) : null}

        {!loading && !error && hasReviews ? (
          <SectionCard className="overflow-hidden !p-0">
            {/* Header */}
            <div className="border-b border-line bg-surface-muted/70 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="ui-stat-label">Submitted Feedback</p>
                  <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">
                    {reviews.length} Review{reviews.length === 1 ? '' : 's'}
                  </h2>
                </div>
                <p className="text-sm font-medium text-ink-muted">
                  Showing most recent first
                </p>
              </div>
            </div>

            {/* Review list */}
            <div className="divide-y divide-line">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="bg-white px-4 py-5 transition hover:bg-brand-50/30 sm:px-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: worker avatar + name + rating */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold uppercase text-white shadow-soft">
                        {review.revieweeName
                          ? review.revieweeName.charAt(0).toUpperCase()
                          : 'W'}
                      </div>

                      <div className="min-w-0 space-y-1">
                        {/* Worker name */}
                        <h3 className="text-base font-bold text-ink sm:text-lg">
                          {review.revieweeName || 'Unknown Worker'}
                        </h3>

                        {/* Star rating */}
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <span className="text-sm font-semibold text-ink-muted">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: date */}
                    <div className="shrink-0 rounded-card border border-line bg-surface-muted px-3 py-2 text-right shadow-soft sm:text-right">
                      <p className="ui-stat-label text-xs">Submitted</p>
                      <p className="mt-1 text-sm font-semibold text-ink">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment ? (
                    <div className="mt-4 rounded-card border border-line bg-surface-muted/60 px-4 py-3">
                      <p className="text-sm leading-7 text-ink-muted">
                        <span className="material-icons mr-1 align-middle text-base text-brand-700">
                          format_quote
                        </span>
                        {review.comment}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-card border border-dashed border-line px-4 py-3">
                      <p className="text-sm italic text-ink-subtle">No written feedback provided.</p>
                    </div>
                  )}

                  {/* Footer: link to request */}
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    <p className="text-xs text-ink-subtle">
                      Request #{review.requestId}
                    </p>
                    <Link
                      to={`/my-requests/${review.requestId}`}
                      className="ui-link text-sm font-semibold"
                    >
                      View Request
                      <span className="material-icons ml-1 align-middle text-sm">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </main>
    </div>
  );
};

export default MyReviewsPage;
