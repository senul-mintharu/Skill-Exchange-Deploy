import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertPanel, EmptyState, LoadingPanel, PageIntro, StatusPill } from '../../components/ui/PortalPrimitives';
import { getMyAssignedJobs } from '../../services/requestService';

const statusMeta = (status) => {
  const normalized = String(status || '').toUpperCase();

  switch (normalized) {
    case 'ASSIGNED':
      return { label: 'Assigned', tone: 'info' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', tone: 'warning' };
    case 'COMPLETED':
      return { label: 'Completed', tone: 'success' };
    default:
      return { label: normalized || 'Unknown', tone: 'neutral' };
  }
};

const MyJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyAssignedJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned jobs. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <section className="ui-panel p-5 sm:p-6">
          <PageIntro
            eyebrow="Worker Jobs"
            title="My Jobs"
            subtitle="Track assigned work, keep the seeker context visible, and open the job that needs your attention next."
            actions={(
              <Link to="/browse-requests" className="ui-button-primary w-full sm:w-auto">
                <span className="material-icons text-base">travel_explore</span>
                Find Work
              </Link>
            )}
            className="mb-0"
          />
        </section>

        {loading ? <LoadingPanel message="Loading assigned jobs..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn’t load jobs"
            action={(
              <button className="ui-button-primary" type="button" onClick={load}>
                Try Again
              </button>
            )}
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && jobs.length === 0 ? (
          <EmptyState
            icon="work_off"
            title="No assigned jobs yet"
            text="Your accepted jobs will appear here once a seeker assigns work to you."
            action={<Link to="/browse-requests" className="ui-button-primary">Browse Requests</Link>}
          />
        ) : null}

        {!loading && !error && jobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => {
              const meta = statusMeta(job.status);
              return (
                <Link
                  key={job.requestId}
                  to={`/requests/${job.requestId}`}
                  className="ui-card-interactive flex flex-col gap-4 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ui-badge-muted">Job #{job.requestId}</span>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                      </div>
                      <h3 className="text-xl font-bold text-ink">
                        {job.requestTitle || `Request #${job.requestId}`}
                      </h3>
                      <p className="inline-flex items-center gap-2 text-sm text-ink-muted">
                        <span className="material-icons text-base text-brand-700">person</span>
                        Seeker: {job.seekerName || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-card border border-line bg-surface-muted px-4 py-3">
                      <p className="ui-stat-label">Location</p>
                      <p className="mt-2 text-sm font-semibold text-ink">{job.locationArea || 'Not set'}</p>
                    </div>
                    <div className="rounded-card border border-line bg-surface-muted px-4 py-3">
                      <p className="ui-stat-label">Budget</p>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {job.budget !== null && job.budget !== undefined ? `Rs. ${Number(job.budget).toLocaleString()}` : 'Negotiable'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-brand-800">View job details</p>
                </Link>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MyJobsPage;
