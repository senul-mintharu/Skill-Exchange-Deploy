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
	getPendingSubmissions,
	getSubmissionDocumentBlob,
	reviewSubmission,
} from '../../services/verificationService';

const formatSubmittedAt = (value) => {
	if (!value) return 'Unknown date';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Unknown date';
	return date.toLocaleString();
};

const extractErrorMessage = (err, fallbackMessage) => {
	if (err?.response?.data instanceof Blob) {
		return fallbackMessage;
	}
	return (
		err?.response?.data?.message ||
		err?.message ||
		fallbackMessage
	);
};

const VerificationReviewPage = () => {
	const [submissions, setSubmissions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [processingId, setProcessingId] = useState(null);
	const [rejectingId, setRejectingId] = useState(null);
	const [rejectReason, setRejectReason] = useState('');

	const pendingCount = submissions.length;

	const loadSubmissions = useCallback(async () => {
		setLoading(true);
		setError('');

		try {
			const data = await getPendingSubmissions();
			setSubmissions(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(extractErrorMessage(err, 'Failed to load pending verification submissions.'));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSubmissions();
	}, [loadSubmissions]);

	const handleApprove = async (submissionId, workerName) => {
		setError('');
		setSuccessMessage('');
		setProcessingId(submissionId);

		try {
			await reviewSubmission(submissionId, true, null);
			setSubmissions((previous) => previous.filter((item) => item.submissionId !== submissionId));
			setSuccessMessage(`${workerName || 'Worker'} verification approved successfully.`);
		} catch (err) {
			setError(extractErrorMessage(err, 'Failed to approve verification submission.'));
		} finally {
			setProcessingId(null);
		}
	};

	const handleOpenReject = (submissionId) => {
		setError('');
		setSuccessMessage('');
		setRejectingId(submissionId);
		setRejectReason('');
	};

	const handleCancelReject = () => {
		setRejectingId(null);
		setRejectReason('');
	};

	const handleConfirmReject = async (submissionId, workerName) => {
		const reason = rejectReason.trim();
		if (!reason) {
			setError('Please provide a brief reason before rejecting this submission.');
			return;
		}

		setError('');
		setSuccessMessage('');
		setProcessingId(submissionId);

		try {
			await reviewSubmission(submissionId, false, reason);
			setSubmissions((previous) => previous.filter((item) => item.submissionId !== submissionId));
			setSuccessMessage(`${workerName || 'Worker'} verification rejected successfully.`);
			setRejectingId(null);
			setRejectReason('');
		} catch (err) {
			setError(extractErrorMessage(err, 'Failed to reject verification submission.'));
		} finally {
			setProcessingId(null);
		}
	};

	const handleViewDocument = async (submissionId) => {
		setError('');

		try {
			const blob = await getSubmissionDocumentBlob(submissionId);
			const objectUrl = URL.createObjectURL(blob);
			window.open(objectUrl, '_blank', 'noopener,noreferrer');
			setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
		} catch (err) {
			setError(
				extractErrorMessage(
					err,
					'The verification file cannot be retrieved. You may reject this submission if the file is missing or corrupted.'
				)
			);
		}
	};

	const sortedSubmissions = useMemo(
		() => [...submissions].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)),
		[submissions]
	);

	return (
		<div className="page-wrapper">
			<main className="ui-shell space-y-6">
				<PageIntro
					eyebrow="Admin"
					title="Verification Review"
					subtitle="Review pending worker verification submissions and approve or reject with an audit trail."
					light
				/>

				<SectionCard className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-xl font-bold text-ink">Pending Submission Queue</h2>
						<StatusPill tone="warning" icon="hourglass_top">
							{pendingCount} Pending
						</StatusPill>
					</div>

					<ErrorBanner message={error} onClose={() => setError('')} />
					<ErrorBanner
						message={successMessage}
						type="success"
						onClose={() => setSuccessMessage('')}
					/>

					{loading ? <LoadingPanel message="Loading pending verification submissions..." /> : null}

					{!loading && pendingCount === 0 ? (
						<EmptyState
							icon="verified"
							title="No pending verification submissions"
							text="All worker verification requests are currently reviewed."
						/>
					) : null}

					{!loading && pendingCount > 0 ? (
						<div className="space-y-4">
							{sortedSubmissions.map((submission) => {
								const isProcessing = processingId === submission.submissionId;
								const isRejecting = rejectingId === submission.submissionId;

								return (
									<article
										key={submission.submissionId}
										className="rounded-card border border-line bg-white p-4 shadow-soft md:p-5"
									>
										<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
											<div className="space-y-2">
												<h3 className="text-lg font-bold text-ink">{submission.workerName || 'Unnamed worker'}</h3>
												<p className="text-sm text-ink-muted">{submission.workerEmail || 'No email available'}</p>
												<p className="text-sm text-ink-muted">
													Submitted: <span className="font-semibold text-ink">{formatSubmittedAt(submission.submittedAt)}</span>
												</p>
												<p className="text-sm text-ink-muted">
													Document: <span className="font-semibold text-ink">{submission.documentName || 'Unknown document'}</span>
												</p>
											</div>

											<div className="flex flex-wrap items-center gap-2">
												<button
													type="button"
													className="ui-button-secondary"
													onClick={() => handleViewDocument(submission.submissionId)}
													disabled={isProcessing}
												>
													View Document
												</button>
												<button
													type="button"
													className="ui-button-primary"
													onClick={() => handleApprove(submission.submissionId, submission.workerName)}
													disabled={isProcessing}
												>
													{isProcessing ? 'Processing...' : 'Approve'}
												</button>
												<button
													type="button"
													className="ui-button-danger"
													onClick={() => handleOpenReject(submission.submissionId)}
													disabled={isProcessing}
												>
													Reject
												</button>
											</div>
										</div>

										{isRejecting ? (
											<div className="mt-4 space-y-3 rounded-card border border-amber-200 bg-amber-50 p-4">
												<label htmlFor={`reject-reason-${submission.submissionId}`} className="ui-label">
													Rejection reason
												</label>
												<textarea
													id={`reject-reason-${submission.submissionId}`}
													className="ui-textarea"
													placeholder="Provide a brief reason for rejection..."
													value={rejectReason}
													onChange={(event) => setRejectReason(event.target.value)}
													rows={3}
												/>
												<div className="flex flex-wrap gap-2">
													<button
														type="button"
														className="ui-button-danger"
														onClick={() => handleConfirmReject(submission.submissionId, submission.workerName)}
														disabled={isProcessing}
													>
														{isProcessing ? 'Processing...' : 'Confirm Rejection'}
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

export default VerificationReviewPage;
