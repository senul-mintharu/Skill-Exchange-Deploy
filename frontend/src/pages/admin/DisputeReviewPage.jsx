import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBanner from '../../components/common/ErrorBanner';
import { EmptyState, LoadingPanel, PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';
import { getOpenDisputes } from '../../services/disputeService';

const formatDateTime = (value) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'N/A';
	return date.toLocaleString();
};

const reasonSnippet = (reason) => {
	if (!reason) return 'No reason provided';
	if (reason.length <= 90) return reason;
	return `${reason.slice(0, 90)}...`;
};

const DisputeReviewPage = () => {
	const navigate = useNavigate();
	const [disputes, setDisputes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		let ignore = false;

		const fetchOpenDisputes = async () => {
			setLoading(true);
			setError('');

			try {
				const data = await getOpenDisputes();
				if (!ignore) {
					setDisputes(Array.isArray(data) ? data : []);
				}
			} catch (err) {
				if (!ignore) {
					setError(err?.response?.data?.message || 'Failed to load open disputes.');
					setDisputes([]);
				}
			} finally {
				if (!ignore) {
					setLoading(false);
				}
			}
		};

		fetchOpenDisputes();

		return () => {
			ignore = true;
		};
	}, []);

	const sortedDisputes = useMemo(
		() => [...disputes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
		[disputes]
	);

	return (
		<div className="page-wrapper">
			<main className="ui-shell space-y-6">
				<PageIntro
					eyebrow="Admin"
					title="Disputes Management"
					subtitle="Open a dispute and submit a formal final ruling when your review is complete."
					light
				/>

				<SectionCard className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-xl font-bold text-ink">Open Disputes</h2>
						<StatusPill tone="danger" icon="report_problem">
							{sortedDisputes.length} Open
						</StatusPill>
					</div>

					<ErrorBanner message={error} onClose={() => setError('')} />

					{loading ? <LoadingPanel message="Loading open disputes..." /> : null}

					{!loading && sortedDisputes.length === 0 ? (
						<EmptyState
							icon="task_alt"
							title="There are no active disputes requiring attention."
							text="New escalations will appear here when a job is marked as not completed."
						/>
					) : null}

					{!loading && sortedDisputes.length > 0 ? (
						<div className="overflow-x-auto rounded-card border border-line">
							<table className="min-w-full bg-white">
								<thead className="bg-surface-muted">
									<tr>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Job ID</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Seeker</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Worker</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Reason</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Date Raised</th>
										<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Action</th>
									</tr>
								</thead>
								<tbody>
									{sortedDisputes.map((dispute) => (
										<tr key={dispute.id} className="border-t border-line hover:bg-brand-50/50">
											<td className="px-4 py-3 text-sm font-semibold text-ink">#{dispute.requestId}</td>
											<td className="px-4 py-3 text-sm text-ink-muted">{dispute.seekerName || 'Unknown seeker'}</td>
											<td className="px-4 py-3 text-sm text-ink-muted">{dispute.workerName || 'Unknown worker'}</td>
											<td className="px-4 py-3 text-sm text-ink-muted" title={dispute.seekerReason || ''}>
												{reasonSnippet(dispute.seekerReason)}
											</td>
											<td className="px-4 py-3 text-sm text-ink-muted">{formatDateTime(dispute.createdAt)}</td>
											<td className="px-4 py-3 text-sm">
												<button
													type="button"
													className="ui-button-secondary"
													onClick={() => navigate(`/admin/disputes/${dispute.id}`)}
												>
													View Details
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : null}
				</SectionCard>
			</main>
		</div>
	);
};

export default DisputeReviewPage;
