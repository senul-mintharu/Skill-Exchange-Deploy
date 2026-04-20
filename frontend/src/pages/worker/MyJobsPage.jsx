import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertPanel, EmptyState, LoadingPanel, PageIntro, StatusPill } from '../../components/ui/PortalPrimitives';
import { getMyAssignedJobs, workerMarkJobDone } from '../../services/requestService';

const statusMeta = (status) => {
  const normalized = String(status || '').toUpperCase();
  switch (normalized) {
    case 'ASSIGNED':       return { label: 'Active — Awaiting Completion', tone: 'info' };
    case 'WORKER_COMPLETED': return { label: 'Awaiting Seeker Confirmation', tone: 'warning' };
    case 'COMPLETED':      return { label: 'Completed', tone: 'success' };
    case 'NOT_COMPLETED':  return { label: 'Disputed', tone: 'danger' };
    default:               return { label: String(status || '').replaceAll('_', ' '), tone: 'neutral' };
  }
};

const MyJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingDone, setMarkingDone] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

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

  const handleMarkDone = async (job) => {
    if (!window.confirm(
      `Mark "${job.requestTitle || `Job #${job.requestId}`}" as completed?\n\nOnly do this after the seeker has paid you in cash and all work is fully done.`
    )) return;

    setMarkingDone(job.requestId);
    setActionError('');
    setActionSuccess('');
    try {
      await workerMarkJobDone(job.requestId);
      setActionSuccess(`"${job.requestTitle || `Job #${job.requestId}`}" marked as done. Waiting for seeker to confirm.`);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to mark job as done. Please try again.');
    } finally {
      setMarkingDone(null);
    }
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <section className="ui-panel p-5 sm:p-6">
          <PageIntro
            eyebrow="Worker Jobs"
            title="My Jobs"
            subtitle="Track assigned work and mark jobs complete once the seeker has paid you in cash."
            actions={(
              <Link to="/browse-requests" className="ui-button-primary w-full sm:w-auto">
                <span className="material-icons text-base">travel_explore</span>
                Find Work
              </Link>
            )}
            className="mb-0"
          />
        </section>

        {actionSuccess ? (
          <AlertPanel tone="success" icon="check_circle" title="Job updated">
            <p>{actionSuccess}</p>
          </AlertPanel>
        ) : null}

        {actionError ? (
          <AlertPanel tone="danger" icon="error_outline" title="Action failed">
            <p>{actionError}</p>
          </AlertPanel>
        ) : null}

        {loading ? <LoadingPanel message="Loading assigned jobs..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn't load jobs"
            action={<button className="ui-button-primary" type="button" onClick={load}>Try Again</button>}
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
              const isAssigned = String(job.status || '').toUpperCase() === 'ASSIGNED';
              const isWorkerCompleted = String(job.status || '').toUpperCase() === 'WORKER_COMPLETED';
              const isBusy = markingDone === job.requestId;

              return (
                <div key={job.requestId} className="ui-card flex flex-col gap-4 p-5">
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
                        {job.seekerName || 'Unknown'}
                        {job.seekerPhone ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="material-icons text-base text-brand-700">phone</span>
                            {job.seekerPhone}
                          </span>
                        ) : null}
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
                        {job.budget !== null && job.budget !== undefined
                          ? `Rs. ${Number(job.budget).toLocaleString()}`
                          : 'Negotiable'}
                      </p>
                    </div>
                  </div>

                  {isWorkerCompleted ? (
                    <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="material-icons text-base text-amber-700">hourglass_top</span>
                        <p className="text-sm text-amber-800">
                          You marked this job as done. Waiting for the seeker to confirm.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row">
                    <Link
                      to={`/requests/${job.requestId}`}
                      className="ui-button-ghost w-full justify-center sm:flex-1"
                    >
                      <span className="material-icons text-base">visibility</span>
                      View Details
                    </Link>
                    {isAssigned ? (
                      <button
                        type="button"
                        className="ui-button-primary w-full justify-center sm:flex-1"
                        onClick={() => handleMarkDone(job)}
                        disabled={isBusy}
                      >
                        {isBusy ? (
                          <><span className="material-icons animate-spin text-base">refresh</span> Marking done...</>
                        ) : (
                          <><span className="material-icons text-base">task_alt</span> Mark as Done</>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MyJobsPage;
