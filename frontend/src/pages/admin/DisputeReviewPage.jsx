import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBanner from '../../components/common/ErrorBanner';
import { EmptyState, LoadingPanel, PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';
import { getOpenDisputesPaged } from '../../services/disputeService';

const PAGE_SIZE = 10;

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

	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);

	const loadDisputes = useCallback(async (page = 0) => {
		setLoading(true);
		setError('');

		try {
			const data = await getOpenDisputesPaged({ page, size: PAGE_SIZE });
			const content = Array.isArray(data?.content) ? data.content : [];

			setDisputes(content);
			setCurrentPage(Number.isInteger(data?.page) ? data.page : page);
			setTotalPages(Number.isInteger(data?.totalPages) ? data.totalPages : 0);
			setTotalElements(Number.isInteger(data?.totalElements) ? data.totalElements : content.length);
		} catch (err) {
			setError(err?.response?.data?.message || 'Failed to load active disputes.');
			setDisputes([]);
			setTotalPages(0);
			setTotalElements(0);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadDisputes(0);
	}, [loadDisputes]);

	const hasDisputes = disputes.length > 0;

	const sortedDisputes = useMemo(
		() => [...disputes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
		[disputes]
	);

	const handleOpenDetails = (disputeId) => {
		if (!disputeId) return;
		navigate(`/admin/disputes/${disputeId}`);
	};

	return (
		<div className="page-wrapper">
			<main className="ui-shell space-y-6">
				<PageIntro
					eyebrow="Admin"
					title="Disputes Management"
					subtitle="Unified trust and dispute workflow: review conflicts, contact both parties, then resolve or ban when required."
					light
				/>

				<SectionCard className="space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 className="text-xl font-bold text-ink">Open Disputes</h2>
						<StatusPill tone="danger" icon="report_problem">
							{sortedDisputes.length} on this page · {totalElements} total open
						</StatusPill>
					</div>

					<ErrorBanner message={error} onClose={() => setError('')} />

					{loading ? <LoadingPanel message="Loading active disputes..." /> : null}

					{!loading && !hasDisputes ? (
						<EmptyState
							icon="task_alt"
							title="There are no active disputes requiring attention."
							text="New dispute records will appear here when seekers raise unresolved job conflicts."
						/>
					) : null}

					{!loading && hasDisputes ? (
						<>
							<div className="overflow-hidden rounded-panel border border-line bg-white shadow-card">
								<div className="overflow-x-auto">
								<table className="min-w-full bg-white">
									<thead className="bg-surface-muted">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Job ID</th>
											<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Seeker</th>
											<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Worker</th>
											<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Reason</th>
											<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Date Raised</th>
											<th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Actions</th>
										</tr>
									</thead>
									<tbody>
										{sortedDisputes.map((dispute) => (
											<tr
												key={dispute.id}
												className="cursor-pointer border-t border-line transition hover:bg-brand-50/50"
												onClick={() => handleOpenDetails(dispute.id)}
											>
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
														onClick={(event) => {
															event.stopPropagation();
															handleOpenDetails(dispute.id);
														}}
													>
														View Details
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
								</div>
							</div>

							<div className="flex flex-wrap items-center justify-between gap-3 pt-2">
								<p className="text-sm text-ink-muted">
									Showing page <span className="font-semibold text-ink">{currentPage + 1}</span>
									{' '}of <span className="font-semibold text-ink">{Math.max(totalPages, 1)}</span>
								</p>
								<div className="flex items-center gap-2">
									<button
										type="button"
										className="ui-button-ghost"
										disabled={currentPage === 0}
										onClick={() => loadDisputes(currentPage - 1)}
									>
										Previous
									</button>
									<button
										type="button"
										className="ui-button-ghost"
										disabled={totalPages === 0 || currentPage >= totalPages - 1}
										onClick={() => loadDisputes(currentPage + 1)}
									>
										Next
									</button>
								</div>
							</div>
						</>
					) : null}
				</SectionCard>
			</main>
		</div>
	);
};

export default DisputeReviewPage;
