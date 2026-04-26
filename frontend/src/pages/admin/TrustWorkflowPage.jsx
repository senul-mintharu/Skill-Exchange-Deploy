import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorBanner from '../../components/common/ErrorBanner';
import {
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { getOpenDisputesPaged } from '../../services/disputeService';
import {
  adminApproveProfilePaymentSlip,
  adminRejectProfilePaymentSlip,
  getAdminPendingProfilePaymentSlips,
  getAdminProfilePaymentSlipBlob,
} from '../../services/profileService';
import {
  adminApprovePaymentSlip,
  adminRejectPaymentSlip,
  getAdminPaymentSlipBlob,
  getAdminPendingPaymentSlips,
} from '../../services/requestService';
import {
  getPendingSubmissions,
  getSubmissionDocumentBlob,
  reviewSubmission,
} from '../../services/verificationService';
import { formatBudget, formatCategoryLabel } from '../../utils/constants';

const DISPUTE_PAGE_SIZE = 200;

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

const extractErrorMessage = (err, fallback) => {
  if (err?.response?.data instanceof Blob) return fallback;
  return err?.response?.data?.message || err?.message || fallback;
};

const prettyDisputeStatus = (status) => {
  if (!status) return 'Open';
  return String(status).replaceAll('_', ' ');
};

/**
 * SCRUM-110 + SCRUM-111 — Unified trust workflow: verifications, disputes, and payment proofs.
 * Admins can update verification and payment outcomes inline; disputes link to resolution detail.
 * Queue sorted oldest-first. Status column reflects current workflow state (AC4).
 */
const TrustWorkflowPage = () => {
  const [verifications, setVerifications] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [paymentSlips, setPaymentSlips] = useState([]);
  const [workerProfilePayments, setWorkerProfilePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorVerification, setErrorVerification] = useState('');
  const [errorDispute, setErrorDispute] = useState('');
  const [errorPayment, setErrorPayment] = useState('');
  const [errorWorkerProfilePayment, setErrorWorkerProfilePayment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [verifyProcessingId, setVerifyProcessingId] = useState(null);
  const [verifyRejectingId, setVerifyRejectingId] = useState(null);
  const [verifyRejectReason, setVerifyRejectReason] = useState('');

  /** Seeker request slip: `r:${id}`; worker registration: `w:${profileId}` */
  const [slipProcessingKey, setSlipProcessingKey] = useState(null);
  const [slipRejectingKey, setSlipRejectingKey] = useState(null);
  const [slipRejectReason, setSlipRejectReason] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorVerification('');
    setErrorDispute('');
    setErrorPayment('');
    setErrorWorkerProfilePayment('');
    setSuccessMessage('');

    const results = await Promise.allSettled([
      getPendingSubmissions(),
      getOpenDisputesPaged({ page: 0, size: DISPUTE_PAGE_SIZE }),
      getAdminPendingPaymentSlips(),
      getAdminPendingProfilePaymentSlips(),
    ]);

    if (results[0].status === 'fulfilled') {
      const data = results[0].value;
      setVerifications(Array.isArray(data) ? data : []);
    } else {
      setVerifications([]);
      setErrorVerification(
        extractErrorMessage(results[0].reason, 'Failed to load pending verifications.'),
      );
    }

    if (results[1].status === 'fulfilled') {
      const data = results[1].value;
      const list = Array.isArray(data?.content) ? data.content : [];
      setDisputes(list);
    } else {
      setDisputes([]);
      setErrorDispute(extractErrorMessage(results[1].reason, 'Failed to load open disputes.'));
    }

    if (results[2].status === 'fulfilled') {
      const data = results[2].value;
      setPaymentSlips(Array.isArray(data) ? data : []);
    } else {
      setPaymentSlips([]);
      setErrorPayment(extractErrorMessage(results[2].reason, 'Failed to load pending payment slips.'));
    }

    if (results[3].status === 'fulfilled') {
      const data = results[3].value;
      setWorkerProfilePayments(Array.isArray(data) ? data : []);
    } else {
      setWorkerProfilePayments([]);
      setErrorWorkerProfilePayment(
        extractErrorMessage(results[3].reason, 'Failed to load worker profile payment slips.'),
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

    paymentSlips.forEach((r) => {
      const t = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      rows.push({
        key: `rq-${r.id}`,
        kind: 'payment',
        sortTime: t,
        request: r,
      });
    });

    workerProfilePayments.forEach((p) => {
      const t = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
      rows.push({
        key: `wp-${p.id}`,
        kind: 'workerProfilePayment',
        sortTime: t,
        profile: p,
      });
    });

    rows.sort((a, b) => {
      if (a.sortTime !== b.sortTime) return a.sortTime - b.sortTime;
      return a.key.localeCompare(b.key);
    });

    return rows;
  }, [verifications, disputes, paymentSlips, workerProfilePayments]);

  const pendingCount = queueRows.length;
  const allFailed = Boolean(
    errorVerification && errorDispute && errorPayment && errorWorkerProfilePayment,
  );

  const handleVerifyApprove = async (submissionId, workerName) => {
    setErrorVerification('');
    setSuccessMessage('');
    setVerifyProcessingId(submissionId);
    try {
      await reviewSubmission(submissionId, true, null);
      setVerifications((prev) => prev.filter((item) => item.submissionId !== submissionId));
      setSuccessMessage(`${workerName || 'Worker'} verification approved.`);
    } catch (err) {
      setErrorVerification(extractErrorMessage(err, 'Failed to approve verification.'));
    } finally {
      setVerifyProcessingId(null);
    }
  };

  const handleVerifyRejectConfirm = async (submissionId, workerName) => {
    const reason = verifyRejectReason.trim();
    if (!reason) {
      setErrorVerification('Please provide a brief reason before rejecting.');
      return;
    }
    setErrorVerification('');
    setSuccessMessage('');
    setVerifyProcessingId(submissionId);
    try {
      await reviewSubmission(submissionId, false, reason);
      setVerifications((prev) => prev.filter((item) => item.submissionId !== submissionId));
      setSuccessMessage(`${workerName || 'Worker'} verification rejected.`);
      setVerifyRejectingId(null);
      setVerifyRejectReason('');
    } catch (err) {
      setErrorVerification(extractErrorMessage(err, 'Failed to reject verification.'));
    } finally {
      setVerifyProcessingId(null);
    }
  };

  const handleViewVerifyDoc = async (submissionId) => {
    setErrorVerification('');
    try {
      const blob = await getSubmissionDocumentBlob(submissionId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (err) {
      setErrorVerification(
        extractErrorMessage(err, 'Could not open verification document.'),
      );
    }
  };

  const handleSlipApprove = async (requestId, title) => {
    setErrorPayment('');
    setSuccessMessage('');
    setSlipProcessingKey(`r:${requestId}`);
    try {
      await adminApprovePaymentSlip(requestId);
      setPaymentSlips((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMessage(`Payment for "${title || 'request'}" approved. Request is now live.`);
    } catch (err) {
      setErrorPayment(extractErrorMessage(err, 'Failed to approve payment slip.'));
    } finally {
      setSlipProcessingKey(null);
    }
  };

  const handleWorkerProfileSlipApprove = async (profileId, workerName) => {
    setErrorWorkerProfilePayment('');
    setSuccessMessage('');
    setSlipProcessingKey(`w:${profileId}`);
    try {
      await adminApproveProfilePaymentSlip(profileId);
      setWorkerProfilePayments((prev) => prev.filter((p) => p.id !== profileId));
      setSuccessMessage(
        `Registration payment for "${workerName || 'worker'}" approved. Profile is now public.`,
      );
    } catch (err) {
      setErrorWorkerProfilePayment(extractErrorMessage(err, 'Failed to approve worker payment.'));
    } finally {
      setSlipProcessingKey(null);
    }
  };

  const handleSlipRejectConfirm = async (requestId, title) => {
    const reason = slipRejectReason.trim();
    if (!reason) {
      setErrorPayment('Please provide a reason before rejecting this payment slip.');
      return;
    }
    setErrorPayment('');
    setSuccessMessage('');
    setSlipProcessingKey(`r:${requestId}`);
    try {
      await adminRejectPaymentSlip(requestId, reason);
      setPaymentSlips((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMessage(`Payment for "${title || 'request'}" rejected. Seeker may re-upload.`);
      setSlipRejectingKey(null);
      setSlipRejectReason('');
    } catch (err) {
      setErrorPayment(extractErrorMessage(err, 'Failed to reject payment slip.'));
    } finally {
      setSlipProcessingKey(null);
    }
  };

  const handleWorkerProfileSlipRejectConfirm = async (profileId, workerName) => {
    const reason = slipRejectReason.trim();
    if (!reason) {
      setErrorWorkerProfilePayment('Please provide a reason before rejecting this payment slip.');
      return;
    }
    setErrorWorkerProfilePayment('');
    setSuccessMessage('');
    setSlipProcessingKey(`w:${profileId}`);
    try {
      await adminRejectProfilePaymentSlip(profileId, reason);
      setWorkerProfilePayments((prev) => prev.filter((p) => p.id !== profileId));
      setSuccessMessage(
        `Registration payment for "${workerName || 'worker'}" rejected. Worker may re-upload.`,
      );
      setSlipRejectingKey(null);
      setSlipRejectReason('');
    } catch (err) {
      setErrorWorkerProfilePayment(extractErrorMessage(err, 'Failed to reject worker payment.'));
    } finally {
      setSlipProcessingKey(null);
    }
  };

  const handleViewSlip = async (requestId) => {
    setErrorPayment('');
    try {
      const blob = await getAdminPaymentSlipBlob(requestId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (err) {
      setErrorPayment(extractErrorMessage(err, 'Could not open payment slip.'));
    }
  };

  const handleViewWorkerProfileSlip = async (profileId) => {
    setErrorWorkerProfilePayment('');
    try {
      const blob = await getAdminProfilePaymentSlipBlob(profileId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (err) {
      setErrorWorkerProfilePayment(extractErrorMessage(err, 'Could not open payment slip.'));
    }
  };

  const colSpan = 5;

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Admin"
          title="Trust workflow"
          subtitle="Verifications, disputes, and payment proofs in one queue. Update statuses here or open full pages. Oldest cases first; the table reflects the latest saved state after each action."
          light
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SectionCard className="border-brand-100 bg-brand-50/60">
            <p className="ui-stat-label">Pending verifications</p>
            <p className="mt-2 text-3xl font-bold text-ink">{verifications.length}</p>
            <Link to="/admin/verification" className="mt-3 inline-block text-sm font-semibold text-brand-800 hover:text-brand-900">
              Full verification queue →
            </Link>
          </SectionCard>
          <SectionCard className="border-amber-100 bg-amber-50/70">
            <p className="ui-stat-label">Open disputes</p>
            <p className="mt-2 text-3xl font-bold text-ink">{disputes.length}</p>
            <Link to="/admin/disputes" className="mt-3 inline-block text-sm font-semibold text-amber-900 hover:text-amber-950">
              Disputes management →
            </Link>
          </SectionCard>
          <SectionCard className="border-cyan-100 bg-cyan-50/70 sm:col-span-2 lg:col-span-1">
            <p className="ui-stat-label">Payment slips under review</p>
            <p className="mt-2 text-3xl font-bold text-ink">
              {paymentSlips.length + workerProfilePayments.length}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Seeker: {paymentSlips.length} · Worker reg.: {workerProfilePayments.length}
            </p>
            <Link to="/admin/payment-slips" className="mt-3 inline-block text-sm font-semibold text-cyan-900 hover:text-cyan-950">
              Full payment queue →
            </Link>
          </SectionCard>
        </div>

        <SectionCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Unified moderation queue</h2>
            <StatusPill tone="warning" icon="priority_high">
              {pendingCount} pending
            </StatusPill>
          </div>

          {allFailed ? (
            <ErrorBanner message="Could not load the trust queue. Check your connection and try Refresh." />
          ) : null}
          {!allFailed && errorVerification ? (
            <ErrorBanner message={`Verifications: ${errorVerification}`} />
          ) : null}
          {!allFailed && errorDispute ? (
            <ErrorBanner message={`Disputes: ${errorDispute}`} />
          ) : null}
          {!allFailed && errorPayment ? (
            <ErrorBanner message={`Seeker payment slips: ${errorPayment}`} />
          ) : null}
          {!allFailed && errorWorkerProfilePayment ? (
            <ErrorBanner message={`Worker registration payments: ${errorWorkerProfilePayment}`} />
          ) : null}
          {successMessage ? (
            <ErrorBanner message={successMessage} type="success" onClose={() => setSuccessMessage('')} />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="ui-button-ghost text-sm" onClick={loadAll} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? <LoadingPanel message="Loading trust queue…" /> : null}

          {!loading && pendingCount === 0
            && !errorVerification
            && !errorDispute
            && !errorPayment
            && !errorWorkerProfilePayment ? (
            <EmptyState
              icon="fact_check"
              title="No pending trust cases"
              text="There are no pending verifications, open disputes, or payment slips awaiting review."
            />
          ) : null}

          {!loading && pendingCount === 0
            && (errorVerification || errorDispute || errorPayment || errorWorkerProfilePayment)
            && !allFailed ? (
            <EmptyState
              icon="cloud_off"
              title="Partial queue"
              text="Some sections failed to load. Fix errors above and refresh, or use the dedicated admin pages."
            />
          ) : null}

          {!loading && pendingCount > 0 ? (
            <div className="overflow-hidden rounded-panel border border-line bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Summary</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Waiting since</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueRows.map((row) => {
                      if (row.kind === 'verification') {
                        const v = row.verification;
                        const busy = verifyProcessingId === v.submissionId;
                        const rejecting = verifyRejectingId === v.submissionId;
                        return (
                          <Fragment key={row.key}>
                            <tr className="border-t border-line transition hover:bg-brand-50/40">
                              <td className="px-4 py-3">
                                <StatusPill tone="info" icon="fact_check">Verification</StatusPill>
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill tone="warning" icon="hourglass_top">Pending review</StatusPill>
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
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="ui-button-ghost text-xs"
                                    onClick={() => handleViewVerifyDoc(v.submissionId)}
                                    disabled={busy}
                                  >
                                    View doc
                                  </button>
                                  <button
                                    type="button"
                                    className="ui-button-primary text-xs"
                                    onClick={() => handleVerifyApprove(v.submissionId, v.workerName)}
                                    disabled={busy}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="ui-button-danger text-xs"
                                    onClick={() => {
                                      setVerifyRejectingId(v.submissionId);
                                      setVerifyRejectReason('');
                                      setErrorVerification('');
                                    }}
                                    disabled={busy}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {rejecting ? (
                              <tr className="border-t border-line bg-amber-50/80">
                                <td colSpan={colSpan} className="px-4 py-4">
                                  <p className="ui-label">Rejection reason</p>
                                  <textarea
                                    className="ui-textarea mt-2"
                                    rows={2}
                                    value={verifyRejectReason}
                                    onChange={(e) => setVerifyRejectReason(e.target.value)}
                                    placeholder="Reason shown to the worker…"
                                  />
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="ui-button-danger text-sm"
                                      disabled={busy}
                                      onClick={() => handleVerifyRejectConfirm(v.submissionId, v.workerName)}
                                    >
                                      Confirm reject
                                    </button>
                                    <button
                                      type="button"
                                      className="ui-button-ghost text-sm"
                                      onClick={() => {
                                        setVerifyRejectingId(null);
                                        setVerifyRejectReason('');
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      }

                      if (row.kind === 'payment') {
                        const r = row.request;
                        const rk = `r:${r.id}`;
                        const busy = slipProcessingKey === rk;
                        const rejecting = slipRejectingKey === rk;
                        return (
                          <Fragment key={row.key}>
                            <tr className="border-t border-line transition hover:bg-cyan-50/40">
                              <td className="px-4 py-3">
                                <StatusPill tone="info" icon="receipt_long">Payment</StatusPill>
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill tone="warning">Payment under review</StatusPill>
                              </td>
                              <td className="px-4 py-3 text-sm text-ink">
                                <span className="font-semibold">{r.title || formatCategoryLabel(r.category)}</span>
                                <span className="mt-1 block text-xs text-ink-muted">
                                  {formatCategoryLabel(r.category)} · Seeker: {r.seekerName || '—'} · {formatBudget(r.budget)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-ink-muted">{formatDateTime(r.updatedAt)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="ui-button-ghost text-xs"
                                    onClick={() => handleViewSlip(r.id)}
                                    disabled={busy || !r.paymentSlipUploaded}
                                  >
                                    View slip
                                  </button>
                                  <button
                                    type="button"
                                    className="ui-button-primary text-xs"
                                    onClick={() => handleSlipApprove(r.id, r.title)}
                                    disabled={busy}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="ui-button-danger text-xs"
                                    onClick={() => {
                                      setSlipRejectingKey(rk);
                                      setSlipRejectReason('');
                                      setErrorPayment('');
                                    }}
                                    disabled={busy}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {rejecting ? (
                              <tr className="border-t border-line bg-red-50/60">
                                <td colSpan={colSpan} className="px-4 py-4">
                                  <p className="ui-label text-red-900">Rejection reason (shown to seeker)</p>
                                  <textarea
                                    className="ui-textarea mt-2"
                                    rows={2}
                                    value={slipRejectReason}
                                    onChange={(e) => setSlipRejectReason(e.target.value)}
                                    placeholder="What should the seeker fix before re-uploading?"
                                  />
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="ui-button-danger text-sm"
                                      disabled={busy}
                                      onClick={() => handleSlipRejectConfirm(r.id, r.title)}
                                    >
                                      Confirm reject
                                    </button>
                                    <button
                                      type="button"
                                      className="ui-button-ghost text-sm"
                                      onClick={() => {
                                        setSlipRejectingKey(null);
                                        setSlipRejectReason('');
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      }

                      if (row.kind === 'workerProfilePayment') {
                        const p = row.profile;
                        const wk = `w:${p.id}`;
                        const busy = slipProcessingKey === wk;
                        const rejecting = slipRejectingKey === wk;
                        return (
                          <Fragment key={row.key}>
                            <tr className="border-t border-line transition hover:bg-violet-50/40">
                              <td className="px-4 py-3">
                                <StatusPill tone="info" icon="engineering">Worker reg.</StatusPill>
                              </td>
                              <td className="px-4 py-3">
                                <StatusPill tone="warning">Payment under review</StatusPill>
                              </td>
                              <td className="px-4 py-3 text-sm text-ink">
                                <span className="font-semibold">{p.fullName || 'Worker'}</span>
                                <span className="mt-1 block text-xs text-ink-muted">
                                  Profile #{p.id} · {p.district || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-ink-muted">{formatDateTime(p.updatedAt)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="ui-button-ghost text-xs"
                                    onClick={() => handleViewWorkerProfileSlip(p.id)}
                                    disabled={busy}
                                  >
                                    View slip
                                  </button>
                                  <button
                                    type="button"
                                    className="ui-button-primary text-xs"
                                    onClick={() => handleWorkerProfileSlipApprove(p.id, p.fullName)}
                                    disabled={busy}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="ui-button-danger text-xs"
                                    onClick={() => {
                                      setSlipRejectingKey(wk);
                                      setSlipRejectReason('');
                                      setErrorWorkerProfilePayment('');
                                    }}
                                    disabled={busy}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {rejecting ? (
                              <tr className="border-t border-line bg-red-50/60">
                                <td colSpan={colSpan} className="px-4 py-4">
                                  <p className="ui-label text-red-900">Rejection reason (shown to worker)</p>
                                  <textarea
                                    className="ui-textarea mt-2"
                                    rows={2}
                                    value={slipRejectReason}
                                    onChange={(e) => setSlipRejectReason(e.target.value)}
                                    placeholder="What should the worker fix before re-uploading?"
                                  />
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="ui-button-danger text-sm"
                                      disabled={busy}
                                      onClick={() => handleWorkerProfileSlipRejectConfirm(p.id, p.fullName)}
                                    >
                                      Confirm reject
                                    </button>
                                    <button
                                      type="button"
                                      className="ui-button-ghost text-sm"
                                      onClick={() => {
                                        setSlipRejectingKey(null);
                                        setSlipRejectReason('');
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      }

                      const d = row.dispute;
                      return (
                        <tr key={row.key} className="border-t border-line transition hover:bg-amber-50/40">
                          <td className="px-4 py-3">
                            <StatusPill tone="danger" icon="gavel">Dispute</StatusPill>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill tone="warning">{prettyDisputeStatus(d.status)}</StatusPill>
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
                              className="ui-button-secondary inline-flex items-center justify-center text-xs"
                            >
                              Resolve / update status
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
