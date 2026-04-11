import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { browseRequests } from '../../services/requestService';
import { getProfileByUserId } from '../../services/profileService';
import { getCurrentUser } from '../../services/authService';
import { CATEGORIES, formatBudget, formatCategoryLabel } from '../../utils/constants';
import { AlertPanel, EmptyState, PageIntro, StatusPill } from '../../components/ui/PortalPrimitives';

const PAGE_SIZE = 9;
const selectClass = 'ui-select min-w-[180px]';

const categoryMeta = (category) => {
  const normalized = String(category || '').toUpperCase();

  if (normalized === 'PLUMBING') {
    return { icon: 'plumbing', iconShell: 'border border-brand-200 bg-brand-100 text-brand-950 shadow-inner' };
  }
  if (normalized === 'ELECTRICAL') {
    return { icon: 'bolt', iconShell: 'border border-amber-200 bg-amber-100 text-amber-900 shadow-inner' };
  }
  if (normalized === 'PAINTING') {
    return { icon: 'format_paint', iconShell: 'border border-blue-200 bg-blue-100 text-blue-900 shadow-inner' };
  }
  if (normalized === 'CLEANING') {
    return { icon: 'cleaning_services', iconShell: 'border border-green-200 bg-green-100 text-green-900 shadow-inner' };
  }
  if (normalized === 'CARPENTRY') {
    return { icon: 'handyman', iconShell: 'border border-orange-200 bg-orange-100 text-orange-900 shadow-inner' };
  }
  return { icon: 'home_repair_service', iconShell: 'border border-slate-200 bg-slate-100 text-slate-900 shadow-inner' };
};

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'OPEN') return 'info';
  if (normalized === 'ASSIGNED' || normalized === 'IN_PROGRESS') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'CANCELLED' || normalized === 'NOT_COMPLETED') return 'danger';
  return 'neutral';
};

const prettyLabel = (value) => String(value || 'Unknown').replaceAll('_', ' ');
const excerpt = (text, maxLength = 128) => (!text
  ? 'Open this request to view full details.'
  : (text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text));

const SkeletonCard = () => (
  <div className="ui-card p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="ui-skeleton h-7 w-24 rounded-chip" />
      <div className="ui-skeleton h-7 w-20 rounded-chip" />
    </div>
    <div className="mt-4 space-y-2">
      <div className="ui-skeleton h-6 w-2/3" />
      <div className="ui-skeleton h-4 w-1/2" />
      <div className="ui-skeleton h-4 w-full" />
    </div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="ui-skeleton h-8 w-28 rounded-chip" />
      <div className="ui-skeleton h-9 w-28 rounded-2xl" />
    </div>
  </div>
);

const BrowseRequestsPage = () => {
  const currentUser = getCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const hasActiveFilters = Boolean(keyword || selectedCategory || locationSearch || sortBy !== 'newest');

  const fetchRequests = useCallback(async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: PAGE_SIZE, sortBy };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (locationSearch.trim()) params.locationArea = locationSearch.trim();

      const data = await browseRequests(params);
      const normalized = Array.isArray(data)
        ? { content: data, page, totalPages: 1, totalElements: data.length }
        : {
            content: Array.isArray(data?.content) ? data.content : [],
            page: Number.isInteger(data?.page) ? data.page : page,
            totalPages: Number.isInteger(data?.totalPages) ? data.totalPages : 1,
            totalElements: Number.isInteger(data?.totalElements)
              ? data.totalElements
              : (Array.isArray(data?.content) ? data.content.length : 0),
          };

      setRequests(normalized.content.map((request) => ({
        ...request,
        postedDate: request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Recently',
      })));
      setCurrentPage(normalized.page);
      setTotalPages(normalized.totalPages);
      setTotalElements(normalized.totalElements);
    } catch (err) {
      setError('Failed to load available jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedCategory, locationSearch, sortBy]);

  useEffect(() => {
    fetchRequests(0);
  }, [fetchRequests]);

  useEffect(() => {
    const checkWorkerProfile = async () => {
      if (!currentUser?.id || currentUser?.role !== 'WORKER') return;

      try {
        await getProfileByUserId(currentUser.id);
        setNeedsProfile(false);
      } catch (err) {
        if (err?.response?.status === 404) {
          setNeedsProfile(true);
        }
      }
    };

    checkWorkerProfile();
  }, [currentUser?.id, currentUser?.role]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchRequests(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible);

    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    for (let index = start; index < end; index += 1) {
      pages.push(index);
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button className="ui-button-ghost" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} type="button">
          &laquo; Prev
        </button>
        {start > 0 ? <button className="ui-button-ghost" onClick={() => handlePageChange(0)} type="button">1</button> : null}
        {start > 1 ? <span className="px-2 text-white/70">...</span> : null}
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            className={pageNumber === currentPage ? 'ui-button-primary min-w-[48px]' : 'ui-button-ghost min-w-[48px]'}
            onClick={() => handlePageChange(pageNumber)}
            type="button"
          >
            {pageNumber + 1}
          </button>
        ))}
        {end < totalPages - 1 ? <span className="px-2 text-white/70">...</span> : null}
        {end < totalPages ? (
          <button className="ui-button-ghost" onClick={() => handlePageChange(totalPages - 1)} type="button">
            {totalPages}
          </button>
        ) : null}
        <button className="ui-button-ghost" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} type="button">
          Next &raquo;
        </button>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <section className="ui-panel p-5 sm:p-6">
          <PageIntro
            eyebrow="Worker Discovery"
            title="Find Work"
            subtitle="Browse open requests, scan the essentials quickly, and open the jobs that match your skill set best."
            className="mb-0"
          />
        </section>

        {needsProfile ? (
          <AlertPanel
            tone="info"
            icon="info"
            title="Create your worker profile to unlock quoting"
            action={<Link to="/create-profile" className="ui-button-primary">Create Worker Profile</Link>}
          >
            <p>You can browse jobs now. To submit quotes or manage jobs, please create your worker profile first.</p>
          </AlertPanel>
        ) : null}

        <section className="ui-panel p-5">
          <div className="mb-4 flex flex-col gap-1">
            <p className="ui-stat-label">Request Filters</p>
            <p className="text-sm text-ink-muted">Search by keyword, district, category, or sorting preference.</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_0.9fr_0.9fr_auto]">
            <div className="ui-input-icon-wrap">
              <span className="material-icons text-brand-700">search</span>
              <input
                type="text"
                placeholder="Search by keyword..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && fetchRequests(0)}
              />
            </div>

            <div className="ui-input-icon-wrap">
              <span className="material-icons text-brand-700">location_on</span>
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationSearch}
                onChange={(event) => setLocationSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && fetchRequests(0)}
              />
            </div>

            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className={selectClass}>
              <option value="">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>

            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className={selectClass}>
              <option value="newest">Newest First</option>
              <option value="budget-high">Budget: High to Low</option>
              <option value="budget-low">Budget: Low to High</option>
              <option value="urgency">Urgency: Most Urgent</option>
            </select>

            {hasActiveFilters ? (
              <button
                onClick={() => {
                  setKeyword('');
                  setSelectedCategory('');
                  setLocationSearch('');
                  setSortBy('newest');
                  setCurrentPage(0);
                }}
                className="ui-button-ghost"
                type="button"
              >
                <span className="material-icons text-base">clear</span>
                Clear
              </button>
            ) : null}
          </div>
        </section>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : error ? (
          <EmptyState
            icon="error_outline"
            title="Oops! Something went wrong."
            text={error}
            action={<button className="ui-button-primary" onClick={() => fetchRequests(currentPage)} type="button">Try Again</button>}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon="work_off"
            title="No jobs available right now"
            text={hasActiveFilters ? 'Try adjusting your filters or clearing them.' : 'Check back later for new opportunities.'}
            action={hasActiveFilters ? (
              <button
                className="ui-button-primary"
                onClick={() => {
                  setKeyword('');
                  setSelectedCategory('');
                  setLocationSearch('');
                  setSortBy('newest');
                }}
                type="button"
              >
                Clear Filters
              </button>
            ) : null}
          />
        ) : (
          <>
            <div className="text-sm text-white/90">
              <strong className="text-white">{totalElements}</strong> {totalElements === 1 ? 'job' : 'jobs'} {hasActiveFilters ? 'found' : 'available'}
            </div>

            <ul className="overflow-hidden rounded-panel border border-line bg-white shadow-card divide-y divide-line">
              {requests.map((request) => (
                <li key={request.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${categoryMeta(request.category).iconShell}`}>
                      <span className="material-icons text-[1.45rem]">{categoryMeta(request.category).icon}</span>
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
                          <h3 className="truncate text-lg font-bold text-ink">
                            {request.title || formatCategoryLabel(request.category)}
                          </h3>
                        </div>
                        <div className="flex items-start gap-3">
                          <StatusPill tone={statusTone(request.status)} className="w-fit">
                            {prettyLabel(request.status || 'OPEN')}
                          </StatusPill>
                          <div className="text-right">
                            <p className="text-xl font-extrabold tracking-tight text-ink">{formatBudget(request.budget)}</p>
                            <p className="ui-stat-label">Estimated Budget</p>
                          </div>
                        </div>
                      </div>

                      <p className="mt-2 text-sm leading-7 text-ink-muted">
                        {excerpt(request.description)}
                      </p>

                      <div className="mt-3 flex flex-col gap-3 border-t border-line/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-icons text-base text-brand-600">calendar_today</span>
                            {request.postedDate}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-icons text-base text-brand-600">location_on</span>
                            {request.locationArea}
                          </span>
                          <span className="rounded-chip bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
                            Open
                          </span>
                        </div>
                        <Link to={`/requests/${request.id}`} state={{ from: 'browse-requests' }} className="ui-button-primary w-full justify-center sm:w-auto sm:px-5">
                          <span className="material-icons text-base">description</span>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {renderPagination()}
          </>
        )}
      </main>
    </div>
  );
};

export default BrowseRequestsPage;
