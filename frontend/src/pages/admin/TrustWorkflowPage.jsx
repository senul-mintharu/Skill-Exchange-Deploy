import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBanner from '../../components/common/ErrorBanner';
import {
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { getOpenDisputes } from '../../services/disputeService';
import { getPendingSubmissions } from '../../services/verificationService';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const reasonSnippet = (reason) => {
  if (!reason) return '—';
  if (reason.length <= 72) return reason;
  return `${reason.slice(0, 72)}…`;
};

/**
 * SCRUM-110 — Admin trust workflow: pending verifications + open disputes on one page,
 * sorted oldest-first so the longest-waiting cases appear at the top.
 */
const TrustWorkflowPage = () => {
  const [verifications, setVerifications] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorVerification, setErrorVerification] = useState('');
  const [errorDispute, setErrorDispute] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorVerification('');
    setErrorDispute('');

    const results = await Promise.allSettled([
      getPendingSubmissions(),
      getOpenDisputes(),
    ]);

    if (results[0].status === 'fulfilled') {
      const data = results[0].value;
      setVerifications(Array.isArray(data) ? data : []);
    } else {
      setVerifications([]);
      setErrorVerification(
        results[0].reason?.response?.data?.message
          || results[0].reason?.message
          || 'Failed to load pending verifications.',
      );
    }

    if (results[1].status === 'fulfilled') {
      const data = results[1].value;
      setDisputes(Array.isArray(data) ? data : []);
    } else {
      setDisputes([]);
      setErrorDispute(
        results[1].reason?.response?.data?.message
          || results[1].reason?.message
          || 'Failed to load open disputes.',
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const queueRows = useMemo(() => {
    const rows = [];

    verifications.forEach((v) => {
      const t = v.submittedAt ? new Date(v.submittedAt).getTime() : 0;
      rows.push({
        key: `v-${v.submissionId}`,
        kind: 'verification',
        sortTime: t,
        verification: v,
      });
    });

    disputes.forEach((d) => {
      const t = d.createdAt ? new Date(d.createdAt).getTime() : 0;
      rows.push({
        key: `d-${d.id}`,
        kind: 'dispute',
        sortTime: t,
        dispute: d,
      });
    });

    rows.sort((a, b) => {
      if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
      return a.key.localeCompare(b.key);
    });

    return rows;
  }, [verifications, disputes]);

  const pendingCount = queueRows.length;
  const globalError = errorVerification && errorDispute
    ? 'Could not load trust queue. Check your connection and try again.'
    : '';

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Admin"
          title="Trust workflow"
          subtitle="Pending worker verifications and open disputes in one place. Oldest cases are listed first."
          light
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SectionCard className="border-brand-100 bg-brand-50/60">
            <p className="ui-stat-label">Pending verifications</p>
            <p className="mt-2 text-3xl font-bold text-ink">{verifications.length}</p>
            <Link to="/admin/verification" className="mt-3 inline-block text-sm font-semibold text-brand-800 hover:text-brand-900">
              Open full verification queue →
            </Link>
          </SectionCard>
          <SectionCard className="border-amber-100 bg-amber-50/70">
            <p className="ui-stat-label">Open disputes</p>
            <p className="mt-2 text-3xl font-bold text-ink">{disputes.length}</p>
            <Link to="/admin/disputes" className="mt-3 inline-block text-sm font-semibold text-amber-900 hover:text-amber-950">
              Open disputes management →
            </Link>
          </SectionCard>
        </div>

        <SectionCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Unified pending queue</h2>
            <StatusPill tone="warning" icon="priority_high">
              {pendingCount} pending
            </StatusPill>
          </div>

          {globalError ? <ErrorBanner message={globalError} /> : null}
          {!globalError && errorVerification ? (
            <ErrorBanner message={`Verifications: ${errorVerification}`} />
          ) : null}
          {!globalError && errorDispute ? (
            <ErrorBanner message={`Disputes: ${errorDispute}`} />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="ui-button-ghost text-sm" onClick={loadAll} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? <LoadingPanel message="Loading trust queue…" /> : null}

          {!loading && pendingCount === 0 && !errorVerification && !errorDispute ? (
            <EmptyState
              icon="fact_check"
              title="No pending trust cases"
              text="There are no pending verifications or open disputes right now."
            />
          ) : null}

          {!loading && pendingCount === 0 && (errorVerification || errorDispute) ? (
            <EmptyState
              icon="cloud_off"
              title="Queue unavailable"
              text="Fix the errors above and refresh, or use the dedicated verification and dispute pages."
            />
          ) : null}

          {!loading && pendingCount > 0 ? (
            <div className="overflow-hidden rounded-panel border border-line bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Summary</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Waiting since</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueRows.map((row) => {
                      if (row.kind === 'verification') {
                        const v = row.verification;
                        return (
                          <tr key={row.key} className="border-t border-line transition hover:bg-brand-50/40">
                            <td className="px-4 py-3">
                              <StatusPill tone="info" icon="fact_check">Verification</StatusPill>
                            </td>
                            <td className="px-4 py-3 text-sm text-ink">
                              <span className="font-semibold">{v.workerName || 'Worker'}</span>
                              <span className="text-ink-muted"> · {v.workerEmail || '—'}</span>
                              {v.documentName ? (
                                <span className="mt-1 block text-xs text-ink-muted">{v.documentName}</span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-sm text-ink-muted">{formatDateTime(v.submittedAt)}</td>
                            <td className="px-4 py-3">
                              <Link
                                to="/admin/verification"
                                className="ui-button-secondary inline-flex items-center justify-center"
                              >
                                Review
                              </Link>
                            </td>
                          </tr>
                        );
                      }

                      const d = row.dispute;
                      return (
                        <tr key={row.key} className="border-t border-line transition hover:bg-amber-50/40">
                          <td className="px-4 py-3">
                            <StatusPill tone="danger" icon="gavel">Dispute</StatusPill>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink">
                            <span className="font-semibold">Job #{d.requestId}</span>
                            <span className="mt-1 block text-ink-muted" title={d.seekerReason || ''}>
                              {reasonSnippet(d.seekerReason)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{formatDateTime(d.createdAt)}</td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/disputes/${d.id}`}
                              className="ui-button-secondary inline-flex items-center justify-center"
                            >
                              Open details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </main>
    </div>
  );
};

export default TrustWorkflowPage;
