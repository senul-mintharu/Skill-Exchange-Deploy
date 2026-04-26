import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { getMyRequests } from '../../services/requestService';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
  StatCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { formatCategoryLabel } from '../../utils/constants';

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'OPEN') return 'info';
  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'CANCELLED' || normalized === 'NOT_COMPLETED') return 'danger';
  return 'neutral';
};

const prettyStatus = (status) => String(status || 'Unknown').replaceAll('_', ' ');

const formatDate = (dateString) => {
  if (!dateString) return 'Recently updated';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const excerpt = (text, maxLength = 140) => {
  if (!text) return 'Add more detail to help workers understand the job and quote accurately.';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

const firstName = (name) => {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0];
};

const SeekerDashboard = () => {
  const currentUser = getCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your dashboard. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const summary = {
      total: requests.length,
      open: 0,
      active: 0,
      completed: 0,
      attention: 0,
    };

    requests.forEach((request) => {
      const status = String(request.status || '').toUpperCase();
      if (status === 'OPEN') summary.open += 1;
      else if (status === 'ASSIGNED' || status === 'IN_PROGRESS') summary.active += 1;
      else if (status === 'COMPLETED') summary.completed += 1;
      else if (status === 'NOT_COMPLETED' || status === 'CANCELLED') summary.attention += 1;
    });

    return summary;
  }, [requests]);

  const recentRequests = useMemo(() => (
    [...requests].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    }).slice(0, 5)
  ), [requests]);

  const activeCount = stats.open + stats.active;
  const hasRequests = requests.length > 0;
  const overviewTiles = [
    {
      label: 'Awaiting Quotes',
      value: stats.open,
      tone: 'border-blue-100 bg-blue-50/70 text-blue-900',
    },
    {
      label: 'Active Jobs',
      value: stats.active,
      tone: 'border-amber-100 bg-amber-50/75 text-amber-900',
    },
    {
      label: 'Completed',
      value: stats.completed,
      tone: 'border-green-100 bg-green-50/75 text-green-900',
    },
  ];

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <PageIntro
          eyebrow="Seeker Dashboard"
          title={`Welcome back, ${firstName(currentUser?.fullName)}`}
          subtitle="Stay on top of every request, spot urgent follow-ups quickly, and jump back into the jobs that need your attention."
          light
          actions={(
            <Link to="/create-request" className="ui-button-primary w-full sm:w-auto">
              <span className="material-icons text-base">add</span>
              Create New Request
            </Link>
          )}
        />

        <section className="ui-panel overflow-hidden p-5 lg:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_320px] xl:items-start">
            <div className="space-y-4">
              <span className="ui-badge bg-white/85 text-brand-900">Overview</span>
              <div className="space-y-2">
                <h2 className="max-w-3xl font-display text-[2rem] font-extrabold leading-[1.05] tracking-snugger text-ink md:text-[2.65rem]">
                  {activeCount > 0 ? (
                    <>
                      <span className="bg-brand-gradient bg-clip-text text-transparent">
                        {activeCount}
                      </span>
                      <span className="ml-2 inline-block">
                        Active Request{activeCount === 1 ? '' : 's'} in motion
                      </span>
                    </>
                  ) : (
                    'Your workspace is ready for the next job'
                  )}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-ink-soft">
                  Use this space to monitor open jobs, track work in progress, and revisit completed requests without scanning multiple pages.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {overviewTiles.map((tile) => (
                  <div key={tile.label} className={`rounded-card border px-4 py-3 shadow-soft ${tile.tone}`}>
                    <p className="ui-stat-label !text-current/70">{tile.label}</p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight">{tile.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-card border border-brand-100 bg-white/90 p-4 shadow-soft">
              <p className="ui-stat-label">Next Best Action</p>
              <h3 className="mt-2 text-lg font-bold text-ink">
                {hasRequests ? 'Review your most recent request activity' : 'Post your first service request'}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {hasRequests
                  ? 'Open your latest request to keep details current and make it easier for workers to respond.'
                  : 'A clear request with budget, location, and urgency helps workers quote faster and more accurately.'}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link to={hasRequests ? `/my-requests/${recentRequests[0]?.id}` : '/create-request'} className="ui-button-primary w-full sm:w-auto">
                  <span className="material-icons text-base">{hasRequests ? 'visibility' : 'add'}</span>
                  {hasRequests ? 'Open Latest Request' : 'Create Request'}
                </Link>
                <Link to="/my-requests" className="ui-button-secondary w-full sm:w-auto">
                  <span className="material-icons text-base">dashboard</span>
                  View All Requests
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={stats.total}
            icon="assignment"
            tone="brand"
            description="Every service request you have posted so far."
            compact
          />
          <StatCard
            label="Awaiting Quotes"
            value={stats.open}
            icon="hourglass_top"
            tone="info"
            description="Requests that are open and ready for worker responses."
            compact
          />
          <StatCard
            label="Work In Progress"
            value={stats.active}
            icon="construction"
            tone="warning"
            description="Jobs that already have a worker assigned or are underway."
            compact
          />
          <StatCard
            label="Completed Jobs"
            value={stats.completed}
            icon="task_alt"
            tone="success"
            description="Requests that have been successfully completed."
            compact
          />
        </div>

        {loading ? <LoadingPanel message="Loading your dashboard..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn’t load your dashboard"
            action={<button onClick={loadDashboard} className="ui-button-primary" type="button">Try Again</button>}
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && !hasRequests ? (
          <EmptyState
            icon="assignment_late"
            title="No requests yet"
            text="Create your first service request to start coordinating work and booking workers by date and time."
            action={<Link to="/create-request" className="ui-button-primary">Create Request</Link>}
          />
        ) : null}

        {!loading && !error && hasRequests ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_320px]">
            <SectionCard className="overflow-hidden !p-0">
              <div className="border-b border-line bg-surface-muted/70 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="ui-stat-label">Recent Activity</p>
                    <h2 className="mt-2 text-xl font-bold text-ink sm:text-2xl">Recent Requests</h2>
                  </div>
                  <p className="text-sm font-medium text-ink-muted">
                    Quickly scan status, timing, and location for your latest jobs.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-line">
                {recentRequests.map((request) => (
                  <article key={request.id} className="bg-white px-4 py-4 transition hover:bg-brand-50/35 sm:px-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="ui-badge">{formatCategoryLabel(request.category)}</span>
                          <StatusPill tone={statusTone(request.status)}>{prettyStatus(request.status)}</StatusPill>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold leading-tight text-ink sm:text-2xl">
                            {request.title || formatCategoryLabel(request.category)}
                          </h3>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
                            {excerpt(request.description)}
                          </p>
                        </div>
                      </div>

                      <div className="grid min-w-full gap-3 sm:grid-cols-2 lg:min-w-[280px] lg:max-w-[320px]">
                        <div className="rounded-card border border-line bg-surface-muted px-4 py-3 shadow-soft">
                          <p className="ui-stat-label">Updated</p>
                          <p className="mt-2 text-sm font-semibold text-ink">{formatDate(request.updatedAt || request.createdAt)}</p>
                        </div>
                        <div className="rounded-card border border-line bg-surface-muted px-4 py-3 shadow-soft">
                          <p className="ui-stat-label">Location</p>
                          <p className="mt-2 text-sm font-semibold text-ink">{request.locationArea || 'Not set'}</p>
                        </div>
                        <div className="rounded-card border border-line bg-surface-muted px-4 py-3 shadow-soft sm:col-span-2 lg:col-span-1">
                          <p className="ui-stat-label">Urgency</p>
                          <p className="mt-2 text-sm font-semibold text-ink">{prettyStatus(request.urgency || 'MEDIUM')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium leading-6 text-ink-muted">
                        Open the request to view worker responses, update details, or manage the job.
                      </p>
                      <Link to={`/my-requests/${request.id}`} className="ui-button-primary w-full sm:w-auto">
                        View Request
                        <span className="material-icons text-base">arrow_forward</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </SectionCard>

            <aside className="space-y-5">
              <SectionCard className="border-brand-100 bg-white shadow-card">
                <p className="ui-stat-label">Need Attention</p>
                <h2 className="mt-2 text-xl font-bold text-ink">Priority Snapshot</h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-card border border-blue-100 bg-blue-50/70 px-4 py-3.5">
                    <p className="text-sm font-semibold text-blue-900">Open Requests</p>
                    <p className="mt-2 text-2xl font-extrabold text-blue-900">{stats.open}</p>
                    <p className="mt-2 text-sm leading-6 text-blue-900/80">Open requests waiting for your next action and booking decisions.</p>
                  </div>
                  <div className="rounded-card border border-amber-100 bg-amber-50/80 px-4 py-3.5">
                    <p className="text-sm font-semibold text-amber-900">Jobs In Progress</p>
                    <p className="mt-2 text-2xl font-extrabold text-amber-900">{stats.active}</p>
                    <p className="mt-2 text-sm leading-6 text-amber-900/80">Keep an eye on active work and confirm outcomes when finished.</p>
                  </div>
                  <div className="rounded-card border border-red-100 bg-red-50/80 px-4 py-3.5">
                    <p className="text-sm font-semibold text-red-900">Needs Follow-up</p>
                    <p className="mt-2 text-2xl font-extrabold text-red-900">{stats.attention}</p>
                    <p className="mt-2 text-sm leading-6 text-red-900/80">Cancelled or incomplete requests that may need a new plan.</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard className="border-brand-100 bg-white shadow-card">
                <p className="ui-stat-label">Quick Actions</p>
                <h2 className="mt-2 text-xl font-bold text-ink">Move Faster</h2>
                <div className="mt-4 space-y-3">
                  <Link to="/create-request" className="flex items-start gap-3 rounded-card border border-line bg-surface-muted px-4 py-3.5 transition hover:border-brand-200 hover:bg-brand-50/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                      <span className="material-icons">playlist_add</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">Post a new request</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">Start a fresh job with clear details and urgency.</span>
                    </span>
                  </Link>

                  <Link to="/browse-workers" className="flex items-start gap-3 rounded-card border border-line bg-surface-muted px-4 py-3.5 transition hover:border-brand-200 hover:bg-brand-50/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-900">
                      <span className="material-icons">groups</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">Browse workers</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">Explore skilled professionals before assigning your next job.</span>
                    </span>
                  </Link>

                  <Link to="/my-reviews" className="flex items-start gap-3 rounded-card border border-line bg-surface-muted px-4 py-3.5 transition hover:border-brand-200 hover:bg-brand-50/60">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <span className="material-icons">rate_review</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">My reviews</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">View all feedback you have submitted for completed jobs.</span>
                    </span>
                  </Link>
                </div>
              </SectionCard>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default SeekerDashboard;
