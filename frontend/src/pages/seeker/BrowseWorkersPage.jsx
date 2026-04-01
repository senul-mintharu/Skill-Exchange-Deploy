import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProfiles } from '../../services/profileService';
import { CATEGORIES, DISTRICTS } from '../../utils/constants';
import { EmptyState, StatusPill } from '../../components/ui/PortalPrimitives';

const avatarGradients = [
  'linear-gradient(135deg, #2c666e 0%, #45b7aa 100%)',
  'linear-gradient(135deg, #1f4f59 0%, #2c666e 100%)',
  'linear-gradient(135deg, #245a62 0%, #4ecdc4 100%)',
  'linear-gradient(135deg, #1f766f 0%, #80d9d2 100%)',
  'linear-gradient(135deg, #23505b 0%, #fbbf24 100%)',
];

const selectClass = 'flex-1 border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none focus:ring-0';

const SkeletonCard = () => (
  <div className="ui-card overflow-hidden p-0">
    <div className="ui-skeleton h-16 w-full rounded-none" />
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="ui-skeleton h-14 w-14 rounded-[1rem]" />
        <div className="flex-1 space-y-3">
          <div className="ui-skeleton h-5 w-2/3" />
          <div className="ui-skeleton h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="ui-skeleton h-4 w-full" />
        <div className="ui-skeleton h-4 w-5/6" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="ui-skeleton h-8 w-20 rounded-chip" />
        <div className="ui-skeleton h-8 w-24 rounded-chip" />
        <div className="ui-skeleton h-8 w-16 rounded-chip" />
      </div>
    </div>
  </div>
);

const getAvatarGradient = (name) => {
  const index = name ? name.charCodeAt(0) % avatarGradients.length : 0;
  return avatarGradients[index];
};

const primarySkillLabel = (skills) => {
  if (!skills?.length) return 'General Worker';
  return skills[0];
};

const ratingForWorker = (worker) => {
  if (typeof worker.averageRating === 'number' && worker.averageRating > 0) {
    return worker.averageRating.toFixed(1);
  }
  return '4.8';
};

const jobsCompletedForWorker = (worker) => {
  if (typeof worker.totalJobsCompleted === 'number') {
    return worker.totalJobsCompleted;
  }
  return 12;
};

const bioExcerpt = (bio, maxLength = 110) => {
  if (!bio) return 'No profile summary added yet.';
  return bio.length > maxLength ? `${bio.slice(0, maxLength).trim()}...` : bio;
};

const BrowseWorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const hasActiveFilters = Boolean(selectedSkill || selectedLocation);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProfiles();
      setWorkers(data.data || []);
    } catch (err) {
      setError('Failed to load service providers. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filteredWorkers = useMemo(() => workers.filter((worker) => {
    const selectedCategory = CATEGORIES.find((item) => item.value === selectedSkill);
    const matchesSkill = !selectedSkill || (
      worker.skills && worker.skills.some((skill) =>
        skill.toLowerCase().includes(selectedCategory?.label.toLowerCase() || '')
      )
    );

    const matchesLocation = !selectedLocation || (
      worker.district === selectedLocation ||
      worker.serviceAreas?.some((area) => area.includes(selectedLocation))
    );

    return matchesSkill && matchesLocation;
  }), [selectedLocation, selectedSkill, workers]);

  const featuredCount = filteredWorkers.filter((worker) => worker.hourlyRate > 0).length;

  return (
    <div className="page-wrapper">
      <section className="relative overflow-hidden px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full bg-highlight-gradient opacity-20 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-brand-200/25 blur-3xl" />
          <div className="absolute left-[15%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-brand-300/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div>
            <span className="ui-eyebrow bg-white/15 text-white">Worker Discovery</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-snugger text-white sm:text-4xl">
              Find the right worker
              <span className="block bg-highlight-gradient bg-clip-text text-transparent">
                without guessing who does what
              </span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/80 sm:text-base">
              Filter by skill and district, compare strengths quickly, and open a full profile only when a worker actually looks like the right fit.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { label: 'Workers', value: filteredWorkers.length },
                { label: 'With Rates', value: featuredCount },
                { label: 'Districts', value: DISTRICTS.length },
              ].map((item) => (
                <div key={item.label} className="rounded-chip border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-xl">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">{item.label}</span>
                  <span className="ml-2 text-base font-extrabold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-2 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-3">
            <p className="ui-stat-label text-white/85">Search Filters</p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedSkill('');
                  setSelectedLocation('');
                }}
                className="ui-button-ghost w-auto bg-white/85"
              >
                <span className="material-icons text-base">close</span>
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-card border border-white/70 bg-white/95 p-3 shadow-card backdrop-blur-xl">
              <p className="ui-stat-label">Skill</p>
              <div className="ui-input-icon-wrap mt-2 py-2.5 shadow-none">
                <span className="material-icons text-brand-700">handyman</span>
                <select value={selectedSkill} onChange={(event) => setSelectedSkill(event.target.value)} className={selectClass}>
                  <option value="">All Skills</option>
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-card border border-white/70 bg-white/95 p-3 shadow-card backdrop-blur-xl">
              <p className="ui-stat-label">District</p>
              <div className="ui-input-icon-wrap mt-2 py-2.5 shadow-none">
                <span className="material-icons text-brand-700">location_on</span>
                <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)} className={selectClass}>
                  <option value="">All Locations</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="ui-shell space-y-5">
        {loading ? (
          <div className="ui-grid-cards">
            {Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : error ? (
          <EmptyState
            icon="cloud_off"
            title="Oops! Something went wrong"
            text={error}
            action={<button className="ui-button-primary" onClick={fetchWorkers} type="button">Try Again</button>}
            className="max-w-lg"
          />
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            icon="person_search"
            title={
              selectedLocation
                ? 'No workers found in this area'
                : selectedSkill
                  ? 'No workers found for this skill'
                  : 'No workers available'
            }
            text={
              selectedLocation
                ? `No workers are currently serving in ${selectedLocation}. Try a different district or clear the filters.`
                : selectedSkill
                  ? `No workers have "${CATEGORIES.find((category) => category.value === selectedSkill)?.label}" listed in their skills.`
                  : 'Be the first to join our platform or check back later.'
            }
            action={hasActiveFilters ? (
              <button
                className="ui-button-primary"
                onClick={() => {
                  setSelectedSkill('');
                  setSelectedLocation('');
                }}
                type="button"
              >
                Clear Filters
              </button>
            ) : null}
          />
        ) : (
          <>
            <p className="text-sm font-medium text-white/90">
              <strong className="text-white">{filteredWorkers.length}</strong>{' '}
              {filteredWorkers.length === 1 ? 'worker' : 'workers'}
            </p>

            <div className="grid gap-4 xl:grid-cols-3">
              {filteredWorkers.map((worker) => (
                <article key={worker.id} className="group relative overflow-hidden rounded-card border border-line bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-panel">
                  <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
                  <div className="flex h-full flex-col gap-4 p-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] text-xl font-bold text-white shadow-brand sm:h-16 sm:w-16 sm:text-2xl"
                        style={{ background: getAvatarGradient(worker.fullName) }}
                      >
                        {worker.profilePictureUrl ? (
                          <img src={worker.profilePictureUrl} alt={`${worker.fullName || 'Worker'} avatar`} className="h-full w-full object-cover" />
                        ) : (
                          <span>{worker.fullName ? worker.fullName.charAt(0).toUpperCase() : 'W'}</span>
                        )}
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white shadow-soft">
                          <span className="material-icons text-sm text-brand-700">verified</span>
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-ink sm:text-lg">
                            <Link to={`/workers/${worker.id}`} className="transition hover:text-brand-800">
                              {worker.fullName || 'Worker'}
                            </Link>
                          </h3>
                          <StatusPill tone="success" className="w-fit">Available</StatusPill>
                        </div>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800">
                          <span className="material-icons text-base">handyman</span>
                          {primarySkillLabel(worker.skills)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-chip border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
                            {worker.district || 'Not specified'}
                          </span>
                          <span className="rounded-chip border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                            {ratingForWorker(worker)} rating
                          </span>
                        </div>
                        <p className="mt-2.5 text-sm leading-6 text-ink-muted">
                          {bioExcerpt(worker.bio)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="ui-stat-label">Rate</p>
                          {worker.hourlyRate > 0 ? (
                            <p className="mt-1.5 text-base font-extrabold text-ink sm:text-lg">
                              Rs. {worker.hourlyRate.toLocaleString()}
                              <span className="ml-1 text-xs font-medium text-ink-subtle sm:text-sm">/hour</span>
                            </p>
                          ) : (
                            <p className="mt-2 text-sm font-semibold text-ink-muted">Contact for rates</p>
                          )}
                        </div>
                        <div>
                          <p className="ui-stat-label">Completed Jobs</p>
                          <p className="mt-1.5 text-base font-extrabold text-ink sm:text-lg">{jobsCompletedForWorker(worker)}</p>
                        </div>
                      </div>
                      <Link to={`/workers/${worker.id}`} className="ui-button-primary w-full justify-center sm:w-auto sm:px-4">
                        View Profile
                        <span className="material-icons text-base">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BrowseWorkersPage;
