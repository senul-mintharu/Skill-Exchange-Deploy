import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { browseRequests } from '../../services/requestService';
import { getProfileByUserId } from '../../services/profileService';
import { getCurrentUser } from '../../services/authService';
import { CATEGORIES, formatBudget, formatCategoryLabel, getCategoryIcon } from '../../utils/constants';
import { AlertPanel, EmptyState, PageIntro, StatusPill } from '../../components/ui/PortalPrimitives';

const PAGE_SIZE = 9;
const selectClass = 'ui-select min-w-[180px]';

const SkeletonCard = () => (
  <div className="ui-card p-6">
    <div className="flex items-center justify-between gap-3">
      <div className="ui-skeleton h-8 w-28 rounded-chip" />
      <div className="ui-skeleton h-8 w-24 rounded-chip" />
    </div>
    <div className="mt-5 space-y-3">
      <div className="ui-skeleton h-7 w-4/5" />
      <div className="ui-skeleton h-4 w-2/3" />
      <div className="ui-skeleton h-4 w-full" />
      <div className="ui-skeleton h-4 w-5/6" />
    </div>
    <div className="mt-6 flex items-end justify-between gap-4">
      <div className="ui-skeleton h-10 w-28" />
      <div className="ui-skeleton h-10 w-32 rounded-2xl" />
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
          <div className="ui-grid-cards">
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

            <div className="ui-grid-cards">
              {requests.map((request) => (
                <article key={request.id} className="ui-card-interactive flex flex-col gap-5 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="ui-badge">
                      {getCategoryIcon(request.category)} {formatCategoryLabel(request.category)}
                    </span>
                    <StatusPill tone={request.urgency === 'URGENT' ? 'danger' : request.urgency === 'HIGH' ? 'warning' : 'info'}>
                      {request.urgency || 'MEDIUM'}
                    </StatusPill>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-ink">
                      {request.title || formatCategoryLabel(request.category)}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-ink-muted">
                      <span className="inline-flex items-center gap-2 rounded-chip bg-slate-50 px-3 py-1.5">
                        <span className="material-icons text-base text-brand-700">location_on</span>
                        {request.locationArea}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-chip bg-slate-50 px-3 py-1.5">
                        <span className="material-icons text-base text-brand-700">calendar_today</span>
                        {request.postedDate}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-7 text-ink-muted">
                      {request.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-4">
                    <div>
                      <p className="ui-stat-label">Estimated Budget</p>
                      <p className="mt-2 text-xl font-extrabold text-brand-800">{formatBudget(request.budget)}</p>
                      <p className="mt-1 text-sm text-ink-subtle">Open request</p>
                    </div>
                    <Link to={`/requests/${request.id}`} state={{ from: 'browse-requests' }} className="ui-button-primary">
                      <span className="material-icons text-base">description</span>
                      View Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {renderPagination()}
          </>
        )}
      </main>
    </div>
  );
};

export default BrowseRequestsPage;
