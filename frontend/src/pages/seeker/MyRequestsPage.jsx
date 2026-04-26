import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRequests } from '../../services/requestService';
import { formatBudget, formatCategoryLabel } from '../../utils/constants';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  PageIntro,
  StatusPill,
} from '../../components/ui/PortalPrimitives';

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDING_PAYMENT') return 'warning';
  if (normalized === 'PAYMENT_UNDER_REVIEW') return 'warning';
  if (normalized === 'OPEN') return 'info';
  if (normalized === 'ASSIGNED') return 'warning';
  if (normalized === 'WORKER_COMPLETED') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'CANCELLED' || normalized === 'NOT_COMPLETED') return 'danger';
  return 'neutral';
};

const statusLabel = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDING_PAYMENT') return 'Awaiting Payment';
  if (normalized === 'PAYMENT_UNDER_REVIEW') return 'Under Review';
  if (normalized === 'WORKER_COMPLETED') return 'Confirm Completion';
  if (normalized === 'NOT_COMPLETED') return 'Not Completed';
  return String(status || 'Unknown').replaceAll('_', ' ');
};

const categoryMeta = (category) => {
  const normalized = String(category || '').toUpperCase();

  if (normalized === 'PLUMBING') {
    return {
      icon: 'plumbing',
      iconShell: 'border border-brand-200 bg-brand-100 text-brand-950 shadow-inner',
    };
  }
  if (normalized === 'ELECTRICAL') {
    return {
      icon: 'bolt',
      iconShell: 'border border-amber-200 bg-amber-100 text-amber-900 shadow-inner',
    };
  }
  if (normalized === 'PAINTING') {
    return {
      icon: 'format_paint',
      iconShell: 'border border-blue-200 bg-blue-100 text-blue-900 shadow-inner',
    };
  }
  if (normalized === 'CLEANING') {
    return {
      icon: 'cleaning_services',
      iconShell: 'border border-green-200 bg-green-100 text-green-900 shadow-inner',
    };
  }
  if (normalized === 'CARPENTRY') {
    return {
      icon: 'handyman',
      iconShell: 'border border-orange-200 bg-orange-100 text-orange-900 shadow-inner',
    };
  }
  return {
    icon: 'home_repair_service',
    iconShell: 'border border-slate-200 bg-slate-100 text-slate-900 shadow-inner',
  };
};

const prettyLabel = (value) => String(value || 'Unknown').replaceAll('_', ' ');

const formatDate = (dateString) => {
  if (!dateString) return 'Recently';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const excerpt = (text, maxLength = 128) => {
  if (!text) return 'Open the request to add more detail for workers.';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

const getQuoteCount = (request) => (
  request?.quoteCount
  ?? request?.quotesCount
  ?? request?.quotationCount
  ?? request?.quotationsCount
  ?? 0
);

const actionLabel = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'PENDING_PAYMENT') return 'Complete Payment';
  if (normalized === 'PAYMENT_UNDER_REVIEW') return 'View Details';
  if (normalized === 'ASSIGNED') return 'Track Progress';
  if (normalized === 'WORKER_COMPLETED') return 'Confirm or Dispute';
  if (normalized === 'COMPLETED') return 'View Summary';
  return 'View Details';
};

const requestMetaBadge = (request) => {
  const normalized = String(request.status || '').toUpperCase();
  const quoteCount = getQuoteCount(request);

  if (normalized === 'PENDING_PAYMENT') {
    return { icon: 'payment', text: 'Payment Pending', className: 'text-amber-700' };
  }
  if (normalized === 'PAYMENT_UNDER_REVIEW') {
    return { icon: 'hourglass_top', text: 'Under Review', className: 'text-amber-600' };
  }
  if (normalized === 'WORKER_COMPLETED') {
    return { icon: 'task_alt', text: 'Worker Marked Done', className: 'text-amber-700' };
  }
  if (normalized === 'COMPLETED') {
    return { icon: 'check_circle', text: 'Done', className: 'text-green-700' };
  }

  if (normalized === 'ASSIGNED') {
    return {
      icon: 'radio_button_checked',
      text: 'Active Job',
      className: 'text-amber-700',
    };
  }

  if (normalized === 'WORKER_COMPLETED') {
    return {
      icon: 'task_alt',
      text: 'Needs Your Confirmation',
      className: 'text-amber-700',
    };
  }

  return {
    icon: 'chat_bubble_outline',
    text: `${quoteCount} Quote${quoteCount === 1 ? '' : 's'}`,
    className: quoteCount > 0 ? 'text-orange-600' : 'text-slate-500',
  };
};

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const sortedRequests = useMemo(() => (
    [...requests].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    })
  ), [requests]);

  const stats = useMemo(() => {
    const summary = {
      total: requests.length,
      active: 0,
      history: 0,
      attention: 0,
      completed: 0,
      spent: 0,
    };

    requests.forEach((request) => {
      const status = String(request.status || '').toUpperCase();
      const budgetValue = Number(request.budget || 0);

      if (status === 'PENDING_PAYMENT' || status === 'PAYMENT_UNDER_REVIEW' || status === 'OPEN' || status === 'ASSIGNED' || status === 'WORKER_COMPLETED') {
        summary.active += 1;
      }

      if (status === 'COMPLETED') {
        summary.completed += 1;
        summary.history += 1;
        if (!Number.isNaN(budgetValue)) summary.spent += budgetValue;
      } else if (status === 'CANCELLED' || status === 'NOT_COMPLETED') {
        summary.attention += 1;
        summary.history += 1;
      }
    });

    return summary;
  }, [requests]);

  const summaryItems = [
    {
      label: 'Active Requests',
      count: stats.active,
      icon: 'assignment',
      className: 'border-brand-200 bg-brand-50/80 text-brand-900',
      iconClassName: 'bg-brand-100 text-brand-900',
      countClassName: 'bg-brand-600 text-white',
    },
    {
      label: 'History',
      count: stats.history,
      icon: 'history',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      iconClassName: 'bg-white text-slate-500',
      countClassName: 'bg-white text-slate-700 border border-slate-200',
    },
    {
      label: 'Needs Attention',
      count: stats.attention,
      icon: 'rule',
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      iconClassName: 'bg-white text-slate-500',
      countClassName: 'bg-white text-slate-700 border border-slate-200',
    },
  ];

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-4">
        <PageIntro
          eyebrow="Seeker Requests"
          title="My Requests"
          subtitle="Track open jobs, monitor active work, and jump into the request that needs you next."
          light
          actions={(
            <Link to="/create-request" className="ui-button-primary w-full sm:w-auto">
              <span className="material-icons text-base">add</span>
              Create Request
            </Link>
          )}
        />

        {loading ? <LoadingPanel message="Loading requests..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn’t load requests"
            action={<button className="ui-button-primary" type="button" onClick={loadRequests}>Try Again</button>}
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && requests.length === 0 ? (
          <EmptyState
            icon="assignment_late"
            title="No requests yet"
            text="Post your first job to track job details while booking workers directly by date and time."
            action={(
              <Link to="/create-request" className="ui-button-primary">
                Create Request
              </Link>
            )}
          />
        ) : null}

        {!loading && !error && requests.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="rounded-panel border border-line bg-white p-4 shadow-card sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="ui-stat-label">Overview</p>
                    <h2 className="mt-2 text-lg font-bold text-ink">Request Summary</h2>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-800">
                    {stats.total} Total
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  {summaryItems.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border px-3 py-3 ${item.className}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.iconClassName}`}>
                          <span className="material-icons text-[1.15rem]">{item.icon}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-5">{item.label}</p>
                        </div>
                        <span className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-full px-2.5 py-1 text-sm font-bold ${item.countClassName}`}>
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-panel border border-line bg-white p-4 shadow-card sm:p-5">
                <p className="ui-stat-label">Quick Stats</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3.5">
                    <p className="text-sm text-ink-muted">Total Spent</p>
                    <p className="mt-2 text-xl font-extrabold tracking-tight text-brand-900 sm:text-2xl">
                      {formatBudget(stats.spent)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3.5">
                    <p className="text-sm text-ink-muted">Completed Jobs</p>
                    <p className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                      {stats.completed}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-line bg-slate-50 px-4 py-3.5">
                    <p className="text-sm text-ink-muted">Total Requests</p>
                    <p className="mt-2 text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                      {stats.total}
                    </p>
                  </div>
                </div>
              </section>
            </aside>

            <section>
              <ul className="overflow-hidden rounded-panel border border-line bg-white shadow-card divide-y divide-line">
                {sortedRequests.map((request) => {
                  const category = categoryMeta(request.category);
                  const metaBadge = requestMetaBadge(request);

                  return (
                    <li key={request.id} className="p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${category.iconShell}`}>
                          <span className="material-icons text-[1.45rem]">{category.icon}</span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-chip bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
                                  {formatCategoryLabel(request.category)}
                                </span>
                                <span className="rounded-chip bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                                  {prettyLabel(request.urgency || 'Medium')}
                                </span>
                              </div>
                              <h2 className="truncate text-lg font-bold text-ink">
                                {request.title || formatCategoryLabel(request.category)}
                              </h2>
                            </div>
                            <div className="flex items-start gap-3">
                              <StatusPill tone={statusTone(request.status)} className="w-fit">
                                {statusLabel(request.status)}
                              </StatusPill>
                              <div className="text-right">
                                <p className="text-xl font-extrabold tracking-tight text-ink">{formatBudget(request.budget)}</p>
                                <p className="ui-stat-label">Estimated Budget</p>
                              </div>
                            </div>
                          </div>

                          <p className="mt-2 text-sm leading-7 text-ink-soft">
                            {excerpt(request.description)}
                          </p>

                          <div className="mt-3 border-t border-line/70 pt-3">
                            <div className="flex flex-col gap-2 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex flex-wrap items-center gap-4">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="material-icons text-base text-brand-600">calendar_today</span>
                                  {formatDate(request.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="material-icons text-base text-brand-600">location_on</span>
                                  {request.locationArea || 'Not set'}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${metaBadge.className}`}>
                                  <span className="material-icons text-base">{metaBadge.icon}</span>
                                  {metaBadge.text}
                                </span>
                              </div>
                              <Link to={`/my-requests/${request.id}`} className="ui-button-primary w-full justify-center sm:w-auto">
                                {actionLabel(request.status)}
                                <span className="material-icons text-base">arrow_forward</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MyRequestsPage;
