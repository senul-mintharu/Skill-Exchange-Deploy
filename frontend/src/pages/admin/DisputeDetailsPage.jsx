import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorBanner from '../../components/common/ErrorBanner';
import { EmptyState, LoadingPanel, PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';
import { getDisputeById, resolveDispute } from '../../services/disputeService';

const isResolved = (status) => String(status || '').toUpperCase() === 'RESOLVED';

const formatStatusLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const getJobStatusLabel = (dispute) => {
  const raw = formatStatusLabel(dispute?.requestStatus);
  if (isResolved(dispute?.status) && String(dispute?.requestStatus || '').toUpperCase() === 'NOT_COMPLETED') {
    return 'Conflicted job completed';
  }
  return raw || '—';
};

const DisputeDetailsPage = () => {
  const { disputeId } = useParams();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let ignore = false;

    const fetchDispute = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getDisputeById(disputeId);
        if (!ignore) {
          setDispute(data);
          setResolutionText(data?.resolution || '');
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.message || 'Failed to load dispute details.');
          setDispute(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchDispute();

    return () => {
      ignore = true;
    };
  }, [disputeId]);

  const handleResolve = async (outcome) => {
    const trimmed = resolutionText.trim();

    if (!trimmed) {
      setError('Please add resolution notes so both parties can see why this was closed.');
      return;
    }

    if (!dispute || isResolved(dispute.status)) {
      return;
    }

    if (outcome === 'SUSPEND_WORKER') {
      const ok = window.confirm(
        'Suspend this worker and close the dispute? They will not be able to sign in until an admin reactivates their account. The job will stay in the not-completed state.'
      );
      if (!ok) return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const updated = await resolveDispute(dispute.id, trimmed, outcome);
      setDispute(updated);
      setResolutionText(updated?.resolution || trimmed);
      if (outcome === 'SUSPEND_WORKER') {
        setSuccessMessage('Dispute closed, user banned (suspended), and job marked as conflicted job completed.');
      } else {
        setSuccessMessage('Dispute closed and the job has been marked completed again.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resolve dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Admin"
          title={`Dispute #${disputeId}`}
          subtitle="Review case context and provide a final ruling visible to both parties."
          light
          actions={<Link to="/admin/disputes" className="ui-button-secondary">Back to Disputes</Link>}
        />

        <ErrorBanner message={error} onClose={() => setError('')} />
        <ErrorBanner message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

        {loading ? <LoadingPanel message="Loading dispute details..." /> : null}

        {!loading && !dispute ? (
          <EmptyState
            icon="search_off"
            title="Dispute not found"
            text="The requested dispute could not be loaded."
            action={<Link to="/admin/disputes" className="ui-button-primary">Return to Disputes</Link>}
          />
        ) : null}

        {!loading && dispute ? (
          <>
            <SectionCard className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-ink">Case Summary</h2>
                <StatusPill tone={isResolved(dispute.status) ? 'success' : 'warning'} icon={isResolved(dispute.status) ? 'check_circle' : 'hourglass_top'}>
                  {String(dispute.status || 'OPEN').replaceAll('_', ' ')}
                </StatusPill>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-line bg-surface-muted p-4">
                  <p className="ui-stat-label">Job ID</p>
                  <p className="mt-1 text-base font-semibold text-ink">#{dispute.requestId}</p>
                  <Link
                    to={`/admin/jobs/${dispute.requestId}`}
                    className="mt-2 inline-block text-sm font-semibold text-brand-600 hover:underline"
                  >
                    Open job in admin
                  </Link>
                </div>
                <div className="rounded-card border border-line bg-surface-muted p-4">
                  <p className="ui-stat-label">Job status</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    {getJobStatusLabel(dispute)}
                  </p>
                </div>
                <div className="rounded-card border border-line bg-surface-muted p-4">
                  <p className="ui-stat-label">Date Raised</p>
                  <p className="mt-1 text-base font-semibold text-ink">{formatDateTime(dispute.createdAt)}</p>
                </div>
                <div className="rounded-card border border-line bg-surface-muted p-4">
                  <p className="ui-stat-label">Worker</p>
                  <p className="mt-1 text-base font-semibold text-ink">{dispute.workerName || 'Unknown worker'}</p>
                </div>
              </div>

              <div className="rounded-card border border-line bg-white p-4">
                <p className="ui-stat-label">Contact the raiser (seeker)</p>
                <p className="mt-1 text-base font-semibold text-ink">{dispute.seekerName || 'Unknown seeker'}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {dispute.seekerPhone ? (
                    <a
                      href={`tel:${String(dispute.seekerPhone).replace(/\s+/g, '')}`}
                      className="ui-button-secondary inline-flex items-center gap-1"
                    >
                      Call {dispute.seekerPhone}
                    </a>
                  ) : (
                    <span className="text-ink-muted">No phone on file</span>
                  )}
                  {dispute.seekerEmail ? (
                    <a href={`mailto:${dispute.seekerEmail}`} className="ui-button-ghost">
                      Email seeker
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-card border border-line bg-white p-4">
                <p className="ui-stat-label">Dispute Reason</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-muted">
                  {dispute.seekerReason || 'No reason provided.'}
                </p>
              </div>
            </SectionCard>

            <SectionCard className="space-y-4">
              <h2 className="text-xl font-bold text-ink">Resolution</h2>

              {isResolved(dispute.status) ? (
                <div className="space-y-3 rounded-card border border-green-200 bg-green-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-green-800">Final Decision (Read Only)</p>
                  <p className="whitespace-pre-line text-sm leading-7 text-ink-muted">
                    {dispute.resolution || 'No final resolution note recorded.'}
                  </p>
                  <p className="text-sm text-ink-muted">
                    Resolved At: <span className="font-semibold text-ink">{formatDateTime(dispute.resolvedAt)}</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="ui-field">
                    <label htmlFor="resolution-note" className="ui-label">Final ruling note</label>
                    <textarea
                      id="resolution-note"
                      className="ui-textarea"
                      value={resolutionText}
                      onChange={(event) => setResolutionText(event.target.value)}
                      placeholder="Explain the decision clearly for both the seeker and worker..."
                      rows={5}
                    />
                    <p className="ui-helper">This note will be visible to both parties.</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="ui-button-primary"
                      disabled={submitting}
                      onClick={() => handleResolve('COMPLETE_JOB')}
                    >
                      {submitting ? 'Working...' : 'Resolve — mark job completed'}
                    </button>
                    <button
                      type="button"
                      className="ui-button-secondary border-red-200 text-red-800 hover:bg-red-50"
                      disabled={submitting}
                      onClick={() => handleResolve('SUSPEND_WORKER')}
                    >
                      {submitting ? 'Working...' : 'Cannot resolve — ban user & close'}
                    </button>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Use "mark job completed" when parties resolve verbally. Use "ban user" for serious misconduct;
                    this closes the case as conflicted job completed.
                  </p>
                </div>
              )}
            </SectionCard>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default DisputeDetailsPage;
