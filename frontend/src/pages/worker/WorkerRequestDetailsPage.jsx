import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getRequestById } from '../../services/requestService';
import { getDisputeByRequest } from '../../services/disputeService';
import { formatBudget, formatCategoryLabel, getCategoryIcon } from '../../utils/constants';
import { AlertPanel, EmptyState, LoadingPanel, PageIntro, StatusPill } from '../../components/ui/PortalPrimitives';

const urgencyTone = (urgency) => {
  const normalized = String(urgency || '').toUpperCase();
  if (normalized === 'URGENT') return 'danger';
  if (normalized === 'HIGH') return 'warning';
  return 'info';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const disputeTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'RESOLVED') return 'success';
  if (normalized === 'OPEN') return 'warning';
  return 'neutral';
};

const WorkerRequestDetailsPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [is404, setIs404] = useState(false);
  const [disputeOutcome, setDisputeOutcome] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const data = await getRequestById(requestId);
        const createdAt = data.createdAt ? new Date(data.createdAt) : null;
        setRequest({
          ...data,
          postedDate: createdAt
            ? createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Recently',
          timeAgo: createdAt ? getTimeAgo(createdAt) : 'Recently',
        });
      } catch (err) {
        if (err.response?.status === 404) {
          setIs404(true);
          setError('This request was not found. It may have been removed by the seeker.');
        } else {
          setError('Failed to load request details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchDisputeOutcome = async () => {
      try {
        const dispute = await getDisputeByRequest(requestId);
        setDisputeOutcome(dispute || null);
      } catch (err) {
        if (err?.response?.status === 404) {
          setDisputeOutcome(null);
          return;
        }
        setDisputeOutcome(null);
      }
    };

    if (requestId) {
      fetchRequest();
      fetchDisputeOutcome();
    }
  }, [requestId]);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

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
            icon={is404 ? 'search_off' : 'error_outline'}
            title={is404 ? 'Request Not Found' : 'Something Went Wrong'}
            text={error || 'This request could not be loaded.'}
            action={(
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/browse-requests" className="ui-button-primary">
                  Browse Requests
                </Link>
                {!is404 ? (
                  <button className="ui-button-ghost" onClick={() => window.location.reload()} type="button">
                    Try Again
                  </button>
                ) : null}
              </div>
            )}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <section className="ui-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4">
            <Link to="/browse-requests" className="ui-link">
              <span className="material-icons text-base">arrow_back</span>
              Back to Browse Requests
            </Link>
            <PageIntro
              eyebrow="Worker Request View"
              title="Request Details"
              subtitle="Review the job carefully, confirm the budget and urgency, and send a quote only when the scope feels right."
              className="mb-0"
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_380px]">
          <section className="space-y-5">
            <article className="ui-panel p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="ui-badge">
                  {getCategoryIcon(request.category)} {formatCategoryLabel(request.category)}
                </span>
                <StatusPill tone={urgencyTone(request.urgency)}>{request.urgency || 'MEDIUM'}</StatusPill>
                <StatusPill tone="neutral">{request.status}</StatusPill>
                <span className="text-sm font-medium text-white/80 xl:ml-auto">{request.timeAgo}</span>
              </div>

              <h1 className="mt-5 font-display text-3xl font-extrabold tracking-snugger text-ink">
                {request.title || formatCategoryLabel(request.category)}
              </h1>

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-ink-muted">
                <span className="ui-badge-muted">
                  <span className="material-icons text-base">location_on</span>
                  {request.locationArea}
                </span>
                <span className="ui-badge-muted">
                  <span className="material-icons text-base">calendar_today</span>
                  Posted {request.postedDate}
                </span>
                <span className="ui-badge-muted">
                  <span className="material-icons text-base">tag</span>
                  #{request.id}
                </span>
              </div>

              <div className="mt-6 rounded-card border border-line bg-white px-5 py-5">
                <h2 className="text-xl font-bold text-ink">Job Description</h2>
                <p className="mt-3 text-sm leading-7 text-ink-muted">{request.description}</p>
              </div>

              {disputeOutcome ? (
                <div className="mt-6 rounded-card border border-line bg-white px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-ink">Dispute Outcome</h2>
                    <StatusPill tone={disputeTone(disputeOutcome.status)}>
                      {String(disputeOutcome.status || 'OPEN').replaceAll('_', ' ')}
                    </StatusPill>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-ink">Raised Reason</p>
                  <p className="mt-1 text-sm leading-7 text-ink-muted">
                    {disputeOutcome.seekerReason || 'No reason provided.'}
                  </p>

                  <p className="mt-4 text-sm font-semibold text-ink">Admin Final Decision</p>
                  <p className="mt-1 text-sm leading-7 text-ink-muted">
                    {disputeOutcome.status === 'RESOLVED'
                      ? disputeOutcome.resolution || 'No final ruling note available.'
                      : 'This dispute is currently being reviewed by an administrator.'}
                  </p>

                  {disputeOutcome.status === 'RESOLVED' ? (
                    <p className="mt-2 text-sm text-ink-muted">
                      Resolved At: <span className="font-semibold text-ink">{formatDateTime(disputeOutcome.resolvedAt)}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="ui-section">
                  <p className="ui-stat-label">Estimated Budget</p>
                  <p className="mt-2 text-2xl font-extrabold text-brand-800">{formatBudget(request.budget)}</p>
                </div>
                <div className="ui-section">
                  <p className="ui-stat-label">Urgency Level</p>
                  <p className="mt-2 text-2xl font-extrabold text-ink">{request.urgency || 'Medium'}</p>
                </div>
                <div className="ui-section">
                  <p className="ui-stat-label">Service Location</p>
                  <p className="mt-2 text-lg font-bold text-ink">{request.locationArea}</p>
                </div>
                <div className="ui-section">
                  <p className="ui-stat-label">Category</p>
                  <p className="mt-2 text-lg font-bold text-ink">{formatCategoryLabel(request.category)}</p>
                </div>
              </div>
            </article>
          </section>

          <aside className="space-y-5">
            <section className="ui-panel p-6">
              <p className="ui-stat-label">Estimated Budget</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-800">{formatBudget(request.budget)}</p>
              <button className="ui-button-primary mt-6 flex w-full" onClick={() => navigate(`/requests/${request.id}/quote`)} type="button">
                <span className="material-icons text-base">send</span>
                Send Quote
              </button>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Submit your price and proposal to the seeker with a realistic timeline.
              </p>
            </section>

            <section className="ui-card p-5">
              <h2 className="text-xl font-bold text-ink">Posted By</h2>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white">
                  {request.seekerName ? request.seekerName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <p className="font-semibold text-ink">{request.seekerName || 'Seeker'}</p>
                  {request.seekerPhone ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-muted">
                      <span className="material-icons text-base">phone</span>
                      {request.seekerPhone}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="ui-card p-5">
              <h2 className="text-xl font-bold text-ink">Tips for a Winning Quote</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-muted">
                {[
                  'Offer a competitive price within the budget range.',
                  'Describe your relevant experience clearly.',
                  'Provide a realistic timeline estimate.',
                  'Be professional and responsive to follow-ups.',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="material-icons mt-0.5 text-base text-brand-700">check_circle</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>

            <AlertPanel
              tone="info"
              icon="search"
              title="Browse similar work"
              action={
                <Link to={`/browse-requests?category=${request.category}`} className="ui-button-secondary">
                  Similar {formatCategoryLabel(request.category)} jobs
                </Link>
              }
            >
              <p>Use the category filter to discover more requests like this one.</p>
            </AlertPanel>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default WorkerRequestDetailsPage;
