import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  PageIntro,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import {
  adminApprovePaymentSlip,
  adminRejectPaymentSlip,
  getAdminPendingPaymentSlips,
} from '../../services/requestService';
import { formatBudget, formatCategoryLabel } from '../../utils/constants';

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminPaymentSlipsPage = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadSlips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminPendingPaymentSlips();
      setSlips(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load pending payment slips. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlips();
  }, [loadSlips]);

  const handleApprove = async (requestId, title) => {
    setActionLoading(requestId);
    setActionError('');
    setSuccessMsg('');
    try {
      await adminApprovePaymentSlip(requestId);
      setSuccessMsg(`Payment for "${title}" approved. Request is now live.`);
      setSlips((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve payment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId, title) => {
    setActionLoading(`reject-${requestId}`);
    setActionError('');
    setSuccessMsg('');
    try {
      await adminRejectPaymentSlip(requestId);
      setSuccessMsg(`Payment for "${title}" rejected. Seeker will need to re-upload their slip.`);
      setSlips((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject payment. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <PageIntro
          eyebrow="Admin"
          title="Payment Slip Review"
          subtitle="Review bank transfer slips submitted by seekers. Approve valid payments to publish their requests."
          light
          actions={(
            <button type="button" className="ui-button-ghost w-full sm:w-auto" onClick={loadSlips}>
              <span className="material-icons text-base">refresh</span>
              Refresh
            </button>
          )}
        />

        {successMsg ? (
          <AlertPanel tone="success" icon="check_circle" title="Action completed">
            <p>{successMsg}</p>
          </AlertPanel>
        ) : null}

        {actionError ? (
          <AlertPanel tone="danger" icon="error_outline" title="Action failed">
            <p>{actionError}</p>
          </AlertPanel>
        ) : null}

        {loading ? <LoadingPanel message="Loading pending payment slips..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn't load payment slips"
            action={<button className="ui-button-primary" type="button" onClick={loadSlips}>Try Again</button>}
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && slips.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title="No pending payment slips"
            text="All payment slips have been reviewed. Check back later."
          />
        ) : null}

        {!loading && !error && slips.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                {slips.length} Pending Review
              </span>
            </div>

            <ul className="overflow-hidden rounded-panel border border-line bg-white shadow-card divide-y divide-line">
              {slips.map((request) => {
                const isApproving = actionLoading === request.id;
                const isRejecting = actionLoading === `reject-${request.id}`;
                const isBusy = isApproving || isRejecting;

                return (
                  <li key={request.id} className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-chip bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
                            {formatCategoryLabel(request.category)}
                          </span>
                          <StatusPill tone="warning">Under Review</StatusPill>
                          {request.paymentSlipUploaded ? (
                            <span className="inline-flex items-center gap-1 rounded-chip bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                              <span className="material-icons text-xs">attach_file</span>
                              Slip uploaded
                            </span>
                          ) : null}
                        </div>

                        <h2 className="text-lg font-bold text-ink">
                          {request.title || formatCategoryLabel(request.category)}
                        </h2>

                        <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-icons text-base text-brand-600">person</span>
                            {request.seekerName || 'Unknown Seeker'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-icons text-base text-brand-600">location_on</span>
                            {request.locationArea || 'Not set'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-icons text-base text-brand-600">payments</span>
                            {formatBudget(request.budget)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-icons text-base text-brand-600">schedule</span>
                            Submitted {formatDateTime(request.updatedAt)}
                          </span>
                        </div>

                        {request.description ? (
                          <p className="text-sm leading-6 text-ink-soft line-clamp-2">{request.description}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                        <button
                          type="button"
                          className="ui-button-primary w-full sm:w-auto"
                          disabled={isBusy}
                          onClick={() => handleApprove(request.id, request.title)}
                        >
                          {isApproving ? (
                            <>
                              <span className="material-icons animate-spin text-base">refresh</span>
                              Approving...
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-base">check_circle</span>
                              Approve Payment
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="ui-button-ghost w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
                          disabled={isBusy}
                          onClick={() => handleReject(request.id, request.title)}
                        >
                          {isRejecting ? (
                            <>
                              <span className="material-icons animate-spin text-base">refresh</span>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-base">cancel</span>
                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AdminPaymentSlipsPage;
