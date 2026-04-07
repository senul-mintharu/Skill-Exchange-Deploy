import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorBanner from '../../components/common/ErrorBanner';
import { EmptyState, LoadingPanel, PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';
import { getRequestById } from '../../services/requestService';

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString();
};

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'NOT_COMPLETED' || normalized === 'CANCELLED') return 'danger';
  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'warning';
  return 'info';
};

const AdminJobDetailsPage = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchJob = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getRequestById(requestId);
        if (!ignore) {
          setRequest(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.message || 'Failed to load job details.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchJob();

    return () => {
      ignore = true;
    };
  }, [requestId]);

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Admin"
          title={`Job #${requestId} Details`}
          subtitle="Full job context for dispute review and decision support."
          light
          actions={<Link to="/admin/disputes" className="ui-button-secondary">Back to Disputes</Link>}
        />

        <ErrorBanner message={error} onClose={() => setError('')} />

        {loading ? <LoadingPanel message="Loading job details..." /> : null}

        {!loading && !request ? (
          <EmptyState
            icon="search_off"
            title="Job not found"
            text="This job could not be retrieved. It may have been removed."
            action={<Link to="/admin/disputes" className="ui-button-primary">Return to Disputes</Link>}
          />
        ) : null}

        {!loading && request ? (
          <SectionCard className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">{request.title || 'Service Request'}</h2>
              <StatusPill tone={statusTone(request.status)} icon="assignment">
                {String(request.status || 'UNKNOWN').replaceAll('_', ' ')}
              </StatusPill>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Job ID</p>
                <p className="mt-1 text-base font-semibold text-ink">{request.id}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Category</p>
                <p className="mt-1 text-base font-semibold text-ink">{request.category || 'Not specified'}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Location</p>
                <p className="mt-1 text-base font-semibold text-ink">{request.locationArea || 'Not specified'}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Budget</p>
                <p className="mt-1 text-base font-semibold text-ink">{request.budget ? `LKR ${Number(request.budget).toLocaleString()}` : 'Not specified'}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Seeker</p>
                <p className="mt-1 text-base font-semibold text-ink">{request.seekerName || 'Unknown seeker'}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Assigned Worker</p>
                <p className="mt-1 text-base font-semibold text-ink">{request.assignedWorkerName || 'Not assigned'}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Created</p>
                <p className="mt-1 text-base font-semibold text-ink">{formatDateTime(request.createdAt)}</p>
              </div>
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="ui-stat-label">Last Updated</p>
                <p className="mt-1 text-base font-semibold text-ink">{formatDateTime(request.updatedAt)}</p>
              </div>
            </div>

            <div className="rounded-card border border-line bg-white p-4">
              <p className="ui-stat-label">Description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-muted">
                {request.description || 'No description provided.'}
              </p>
            </div>
          </SectionCard>
        ) : null}
      </main>
    </div>
  );
};

export default AdminJobDetailsPage;
