import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRequests } from '../../services/requestService';
import { formatBudget, formatCategoryLabel } from '../../utils/constants';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  StatusPill,
} from '../../components/ui/PortalPrimitives';

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'OPEN') return 'info';
  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'CANCELLED' || normalized === 'NOT_COMPLETED') return 'danger';
  return 'neutral';
};

const categoryMeta = (category) => {
  const normalized = String(category || '').toUpperCase();

  if (normalized === 'PLUMBING') {
    return {
      icon: 'plumbing',
      iconShell: 'bg-brand-50 text-brand-900',
    };
  }
  if (normalized === 'ELECTRICAL') {
    return {
      icon: 'bolt',
      iconShell: 'bg-amber-50 text-amber-700',
    };
  }
  if (normalized === 'PAINTING') {
    return {
      icon: 'format_paint',
      iconShell: 'bg-blue-50 text-blue-700',
    };
  }
  if (normalized === 'CLEANING') {
    return {
      icon: 'cleaning_services',
      iconShell: 'bg-green-50 text-green-700',
    };
  }
  if (normalized === 'CARPENTRY') {
    return {
      icon: 'handyman',
      iconShell: 'bg-orange-50 text-orange-700',
    };
  }
  return {
    icon: 'home_repair_service',
    iconShell: 'bg-slate-100 text-slate-700',
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
  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'Track Progress';
  if (normalized === 'COMPLETED') return 'View Summary';
  return 'View Details';
};

const requestMetaBadge = (request) => {
  const normalized = String(request.status || '').toUpperCase();
  const quoteCount = getQuoteCount(request);

  if (normalized === 'COMPLETED') {
    return {
      icon: 'check_circle',
      text: 'Done',
      className: 'text-green-700',
    };
  }

  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') {
    return {
      icon: 'radio_button_checked',
      text: 'Active Job',
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

      if (status === 'OPEN' || status === 'ASSIGNED' || status === 'IN_PROGRESS') {
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
        <section className="ui-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="ui-eyebrow">Seeker Requests</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-snugger text-ink sm:text-4xl">
                My Requests
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-soft sm:text-base">
                Track open jobs, monitor active work, and jump into the request that needs you next.
              </p>
            </div>

            <Link to="/create-request" className="ui-button-primary w-full sm:w-auto">
              <span className="material-icons text-base">add</span>
              Create Request
            </Link>
          </div>
        </section>

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
            text="Post your first job to start receiving quotations from workers."
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

            <section className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {sortedRequests.map((request) => {
                  const category = categoryMeta(request.category);
                  const metaBadge = requestMetaBadge(request);

                  return (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-panel border border-line bg-white p-4 shadow-card sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${category.iconShell}`}>
                          <span className="material-icons text-[1.75rem]">{category.icon}</span>
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h2 className="truncate text-2xl font-extrabold leading-tight tracking-snugger text-ink">
                                {request.title || formatCategoryLabel(request.category)}
                              </h2>
                              <p className="mt-1 text-base font-medium text-ink-muted">
                                {formatCategoryLabel(request.category)}
                              </p>
                            </div>
                            <StatusPill tone={statusTone(request.status)} className="w-fit">
                              {prettyLabel(request.status)}
                            </StatusPill>
                          </div>
                        </div>
                      </div>

                      <p className="mt-5 text-base leading-8 text-ink-soft">
                        {excerpt(request.description)}
                      </p>

                      <div className="mt-5 border-t border-line pt-4">
                        <div className="flex flex-col gap-3 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-2">
                              <span className="material-icons text-[1.15rem]">calendar_today</span>
                              {formatDate(request.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <span className="material-icons text-[1.15rem]">location_on</span>
                              {request.locationArea || 'Not set'}
                            </span>
                          </div>

                          <span className={`inline-flex items-center gap-2 text-sm font-semibold ${metaBadge.className}`}>
                            <span className="material-icons text-[1.1rem]">{metaBadge.icon}</span>
                            {metaBadge.text}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                            {prettyLabel(request.urgency || 'Medium')}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-ink">
                            {formatBudget(request.budget)}
                          </span>
                        </div>

                        <Link to={`/my-requests/${request.id}`} className="ui-button-secondary w-full justify-center sm:w-auto">
                          {actionLabel(request.status)}
                          <span className="material-icons text-base">arrow_forward</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MyRequestsPage;
