import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorBanner from '../../components/common/ErrorBanner';
import {
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import {
  adminApprovePaymentSlip,
  adminRejectPaymentSlip,
  getAdminPendingPaymentSlips,
  getAdminPaymentSlipBlob,
} from '../../services/requestService';
import { formatBudget, formatCategoryLabel } from '../../utils/constants';

const formatSubmittedAt = (value) => {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString();
};

const extractErrorMessage = (err, fallback) => {
  if (err?.response?.data instanceof Blob) return fallback;
  return err?.response?.data?.message || err?.message || fallback;
};

const AdminPaymentSlipsPage = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingCount = slips.length;

  const loadSlips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminPendingPaymentSlips();
      setSlips(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load pending payment slips.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlips();
  }, [loadSlips]);

  const handleApprove = async (requestId, title) => {
    setError('');
    setSuccessMessage('');
    setProcessingId(requestId);
    try {
      await adminApprovePaymentSlip(requestId);
      setSlips((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMessage(`Payment for "${title || 'request'}" approved. Request is now live.`);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to approve payment slip.'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (requestId) => {
    setError('');
    setSuccessMessage('');
    setRejectingId(requestId);
    setRejectReason('');
  };

  const handleCancelReject = () => {
    setRejectingId(null);
    setRejectReason('');
  };

  const handleConfirmReject = async (requestId, title) => {
    const reason = rejectReason.trim();
    if (!reason) {
      setError('Please provide a reason before rejecting this payment slip.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setProcessingId(requestId);
    try {
      await adminRejectPaymentSlip(requestId, reason);
      setSlips((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMessage(`Payment for "${title || 'request'}" rejected. Seeker will need to re-upload.`);
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to reject payment slip.'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewSlip = async (requestId) => {
    setError('');
    try {
      const blob = await getAdminPaymentSlipBlob(requestId);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          'The payment slip file could not be retrieved. You may reject this submission if the file is missing.'
        )
      );
    }
  };

  const sortedSlips = useMemo(
    () => [...slips].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)),
    [slips]
  );

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Admin"
          title="Payment Slip Review"
          subtitle="Review bank transfer slips submitted by seekers. Approve valid payments to publish their requests, or reject with a reason."
          light
        />

        <SectionCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Pending Payment Queue</h2>
            <div className="flex items-center gap-3">
              <StatusPill tone="warning">
                {pendingCount} Pending
              </StatusPill>
              <button
                type="button"
                className="ui-button-ghost"
                onClick={loadSlips}
                disabled={loading}
              >
                <span className="material-icons text-base">refresh</span>
                Refresh
              </button>
            </div>
          </div>

          <ErrorBanner message={error} onClose={() => setError('')} />
          <ErrorBanner
            message={successMessage}
            type="success"
            onClose={() => setSuccessMessage('')}
          />

          {loading ? <LoadingPanel message="Loading pending payment slips..." /> : null}

          {!loading && pendingCount === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No pending payment slips"
              text="All payment slips have been reviewed. New submissions will appear here automatically."
            />
          ) : null}

          {!loading && pendingCount > 0 ? (
            <div className="space-y-4">
              {sortedSlips.map((request) => {
                const isProcessing = processingId === request.id;
                const isRejecting = rejectingId === request.id;

                return (
                  <article
                    key={request.id}
                    className="rounded-card border border-line bg-white p-4 shadow-soft md:p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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

                        <h3 className="text-lg font-bold text-ink">
                          {request.title || formatCategoryLabel(request.category)}
                        </h3>

                        <div className="space-y-1 text-sm text-ink-muted">
                          <p>
                            <span className="font-semibold text-ink">Seeker:</span>{' '}
                            {request.seekerName || 'Unknown'}
                            {request.seekerPhone ? ` · ${request.seekerPhone}` : ''}
                          </p>
                          <p>
                            <span className="font-semibold text-ink">Location:</span>{' '}
                            {request.locationArea || 'Not specified'}
                          </p>
                          <p>
                            <span className="font-semibold text-ink">Budget:</span>{' '}
                            {formatBudget(request.budget)}
                          </p>
                          <p>
                            <span className="font-semibold text-ink">Slip submitted:</span>{' '}
                            {formatSubmittedAt(request.updatedAt)}
                          </p>
                        </div>

                        {request.description ? (
                          <p className="line-clamp-2 text-sm leading-6 text-ink-soft">
                            {request.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                        <button
                          type="button"
                          className="ui-button-ghost w-full sm:w-auto"
                          onClick={() => handleViewSlip(request.id)}
                          disabled={isProcessing || !request.paymentSlipUploaded}
                          title={request.paymentSlipUploaded ? 'Open slip in new tab' : 'No slip uploaded'}
                        >
                          <span className="material-icons text-base">open_in_new</span>
                          View Slip
                        </button>
                        <button
                          type="button"
                          className="ui-button-primary w-full sm:w-auto"
                          onClick={() => handleApprove(request.id, request.title)}
                          disabled={isProcessing}
                        >
                          {isProcessing && rejectingId !== request.id ? (
                            <>
                              <span className="material-icons animate-spin text-base">refresh</span>
                              Approving...
                            </>
                          ) : (
                            <>
                              <span className="material-icons text-base">check_circle</span>
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="ui-button-danger w-full sm:w-auto"
                          onClick={() => handleOpenReject(request.id)}
                          disabled={isProcessing}
                        >
                          <span className="material-icons text-base">cancel</span>
                          Reject
                        </button>
                      </div>
                    </div>

                    {isRejecting ? (
                      <div className="mt-4 space-y-3 rounded-card border border-red-200 bg-red-50 p-4">
                        <label
                          htmlFor={`reject-reason-${request.id}`}
                          className="ui-label text-red-800"
                        >
                          Rejection reason
                          <span className="ml-1 text-red-500">*</span>
                        </label>
                        <p className="text-sm text-red-700">
                          This reason will be shown to the seeker so they know what to fix before re-uploading.
                        </p>
                        <textarea
                          id={`reject-reason-${request.id}`}
                          className="ui-textarea"
                          placeholder="e.g. The slip is blurry and the transfer amount is not visible. Please upload a clear image."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="ui-button-danger"
                            onClick={() => handleConfirmReject(request.id, request.title)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <span className="material-icons animate-spin text-base">refresh</span>
                                Processing...
                              </>
                            ) : 'Confirm Rejection'}
                          </button>
                          <button
                            type="button"
                            className="ui-button-ghost"
                            onClick={handleCancelReject}
                            disabled={isProcessing}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}
        </SectionCard>
      </main>
    </div>
  );
};

export default AdminPaymentSlipsPage;
