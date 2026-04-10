import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { getProfileByUserId } from '../../services/profileService';
import { getMyVerification } from '../../services/verificationService';
import { getMyQuotes } from '../../services/quoteService';
import { getMyAssignedJobs } from '../../services/requestService';
import { getMyWorkerDisputes } from '../../services/disputeService';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
  StatCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { formatCategoryLabel } from '../../utils/constants';

const jobStatusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ASSIGNED') return 'info';
  if (normalized === 'IN_PROGRESS') return 'warning';
  if (normalized === 'COMPLETED') return 'success';
  return 'neutral';
};

const quoteStatusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACCEPTED') return 'success';
  if (normalized === 'PENDING') return 'warning';
  if (normalized === 'REJECTED' || normalized === 'NOT_ACCEPTED') return 'danger';
  return 'neutral';
};

const verificationTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'success';
  if (normalized === 'PENDING') return 'warning';
  if (normalized === 'REJECTED') return 'danger';
  return 'info';
};

const prettyLabel = (value) => String(value || 'Unknown').replaceAll('_', ' ');

const firstName = (name) => {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0];
};

const excerpt = (text, maxLength = 130) => {
  if (!text) return 'Add more detail to your profile so seekers understand your experience at a glance.';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
};

const WorkerDashboard = () => {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [expandedDisputeId, setExpandedDisputeId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('NONE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [profileResult, quotesResult, jobsResult, disputesResult, verificationResult] = await Promise.allSettled([
        currentUser?.id ? getProfileByUserId(currentUser.id) : Promise.resolve(null),
        getMyQuotes(),
        getMyAssignedJobs(),
        getMyWorkerDisputes(),
        getMyVerification(),
      ]);

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value || null);
        setNeedsProfile(!profileResult.value);
      } else if (profileResult.reason?.response?.status === 404) {
        setProfile(null);
        setNeedsProfile(true);
      } else {
        throw profileResult.reason;
      }

      if (quotesResult.status === 'fulfilled') {
        setQuotes(Array.isArray(quotesResult.value) ? quotesResult.value : []);
      } else {
        throw quotesResult.reason;
      }

      if (jobsResult.status === 'fulfilled') {
        setJobs(Array.isArray(jobsResult.value) ? jobsResult.value : []);
      } else {
        throw jobsResult.reason;
      }

      // SCRUM-92: Load worker disputes — non-fatal, silently empty on failure
      if (disputesResult.status === 'fulfilled') {
        setDisputes(Array.isArray(disputesResult.value) ? disputesResult.value : []);
      } else {
        setDisputes([]);
      }

      if (verificationResult.status === 'fulfilled') {
        setVerificationStatus(String(verificationResult.value?.verificationStatus || 'NONE').toUpperCase());
      } else {
        const fallbackStatus = String(
          profileResult.status === 'fulfilled'
            ? profileResult.value?.verificationStatus || profileResult.value?.verification?.status || 'NONE'
            : 'NONE',
        ).toUpperCase();
        setVerificationStatus(fallbackStatus);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load your dashboard. Please try again.');
      setProfile(null);
      setQuotes([]);
      setJobs([]);
      setDisputes([]);
      setVerificationStatus('NONE');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const summary = {
      totalQuotes: quotes.length,
      acceptedQuotes: 0,
      pendingQuotes: 0,
      activeJobs: 0,
      completedJobs: 0,
    };

    quotes.forEach((quote) => {
      const status = String(quote.status || '').toUpperCase();
      if (status === 'ACCEPTED') summary.acceptedQuotes += 1;
      else if (status === 'PENDING') summary.pendingQuotes += 1;
    });

    jobs.forEach((job) => {
      const status = String(job.status || '').toUpperCase();
      if (status === 'ASSIGNED' || status === 'IN_PROGRESS') summary.activeJobs += 1;
      if (status === 'COMPLETED') summary.completedJobs += 1;
    });

    return summary;
  }, [jobs, quotes]);

  const recentQuotes = useMemo(() => (
    [...quotes].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      if (rightTime !== leftTime) return rightTime - leftTime;
      return Number(right.id || 0) - Number(left.id || 0);
    }).slice(0, 4)
  ), [quotes]);

  const activeJobs = useMemo(() => (
    [...jobs].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
      return rightTime - leftTime;
    }).slice(0, 4)
  ), [jobs]);

  const averageRating = Number(profile?.averageRating || 0);
  const skills = Array.isArray(profile?.skills) ? profile.skills.slice(0, 4) : [];
  const overviewTiles = [
    {
      label: 'Pending Quotes',
      value: stats.pendingQuotes,
      tone: 'border-amber-100 bg-amber-50/75 text-amber-900',
    },
    {
      label: 'Accepted',
      value: stats.acceptedQuotes,
      tone: 'border-green-100 bg-green-50/75 text-green-900',
    },
    {
      label: 'Completed Jobs',
      value: stats.completedJobs,
      tone: 'border-blue-100 bg-blue-50/70 text-blue-900',
    },
  ];

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Worker Dashboard"
          title={`Welcome back, ${firstName(currentUser?.fullName)}`}
          subtitle="See what needs action first, monitor your quote pipeline, and keep your profile polished so seekers can trust you quickly."
          light
          actions={(
            <>
              <Link to="/browse-requests" className="ui-button-primary">
                <span className="material-icons text-base">travel_explore</span>
                Browse Requests
              </Link>
              <Link
                to={profile?.id ? `/edit-profile/${profile.id}` : '/create-profile'}
                className="ui-button-secondary"
              >
                <span className="material-icons text-base">edit</span>
                {profile?.id ? 'Edit Profile' : 'Create Profile'}
              </Link>
            </>
          )}
        />

        <section className="ui-panel overflow-hidden p-6 lg:p-7">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_340px] xl:items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="ui-badge bg-white/85 text-brand-900">Worker Overview</span>
                {profile ? (
                  <StatusPill tone={verificationTone(verificationStatus)}>
                    Verification: {prettyLabel(verificationStatus)}
                  </StatusPill>
                ) : null}
              </div>
              <div className="space-y-3">
                <h2 className="max-w-3xl font-display text-[2rem] font-extrabold leading-[1.05] tracking-snugger text-ink md:text-[2.65rem]">
                  {stats.activeJobs > 0 ? (
                    <>
                      <span className="bg-brand-gradient bg-clip-text text-transparent">
                        {stats.activeJobs}
                      </span>
                      <span className="ml-4 inline-block">
                        Active Job{stats.activeJobs === 1 ? '' : 's'} on your plate
                      </span>
                    </>
                  ) : (
                    'Your dashboard is clear and ready for the next opportunity'
                  )}
                </h2>
                <p className="max-w-3xl text-base leading-8 text-ink-soft">
                  Keep your most important numbers visible at a glance so you can decide whether to quote, deliver, or refine your profile next.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {overviewTiles.map((tile) => (
                  <div key={tile.label} className={`rounded-card border px-4 py-3 shadow-soft ${tile.tone}`}>
                    <p className="ui-stat-label !text-current/70">{tile.label}</p>
                    <p className="mt-2 text-2xl font-extrabold tracking-tight">{tile.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-panel border border-brand-100 bg-white/90 p-5 shadow-card">
              <p className="ui-stat-label">Focus Right Now</p>
              <h3 className="mt-3 text-xl font-bold text-ink">
                {needsProfile
                  ? 'Complete your worker profile'
                  : stats.pendingQuotes > 0
                    ? 'Track pending quotations'
                    : 'Find your next request'}
              </h3>
              <p className="mt-3 text-sm leading-7 text-ink-muted">
                {needsProfile
                  ? 'A complete profile unlocks quoting and gives seekers confidence in your skills, rate, and service area.'
                  : stats.pendingQuotes > 0
                    ? 'Your pending quotations are still waiting on seeker decisions, so stay ready to respond quickly.'
                    : 'Your profile is in place. Browse new requests and keep your pipeline active.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={needsProfile ? '/create-profile' : stats.pendingQuotes > 0 ? '/my-quotations' : '/browse-requests'}
                  className="ui-button-primary"
                >
                  <span className="material-icons text-base">
                    {needsProfile ? 'person_add' : stats.pendingQuotes > 0 ? 'request_quote' : 'travel_explore'}
                  </span>
                  {needsProfile ? 'Create Profile' : stats.pendingQuotes > 0 ? 'Review Quotations' : 'Browse Work'}
                </Link>
                {profile?.id ? (
                  <Link to={`/profile/${profile.id}`} className="ui-button-secondary">
                    <span className="material-icons text-base">visibility</span>
                    View Public Profile
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {needsProfile ? (
          <AlertPanel
            tone="info"
            icon="info"
            title="Your worker profile still needs to be set up"
            action={<Link to="/create-profile" className="ui-button-primary">Create Worker Profile</Link>}
          >
            <p>Until your profile is ready, seekers cannot properly evaluate your experience and you may miss out on quoting opportunities.</p>
          </AlertPanel>
        ) : null}

        {!needsProfile && verificationStatus !== 'APPROVED' ? (
          <AlertPanel
            tone={verificationStatus === 'PENDING' ? 'warning' : verificationStatus === 'REJECTED' ? 'danger' : 'info'}
            icon={verificationStatus === 'PENDING' ? 'hourglass_top' : verificationStatus === 'REJECTED' ? 'report_problem' : 'verified_user'}
            title={
              verificationStatus === 'PENDING'
                ? 'Verification is still under review'
                : verificationStatus === 'REJECTED'
                  ? 'Verification needs another look'
                  : 'Verification has not been submitted yet'
            }
            action={<Link to="/worker/verification" className="ui-button-primary">Open Verification</Link>}
          >
            <p>
              {verificationStatus === 'PENDING'
                ? 'Your profile is live, but seekers will trust you faster once verification is approved.'
                : verificationStatus === 'REJECTED'
                  ? 'Please upload a corrected verification document to resubmit for review.'
                  : 'Adding the right profile information now will help you stand out when seekers compare workers.'}
            </p>
          </AlertPanel>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Quotes"
            value={stats.totalQuotes}
            icon="request_quote"
            tone="brand"
            description="All quotations you have submitted so far."
          />
          <StatCard
            label="Pending Quotes"
            value={stats.pendingQuotes}
            icon="hourglass_top"
            tone="warning"
            description="Still waiting for seeker decisions."
          />
          <StatCard
            label="Accepted Quotes"
            value={stats.acceptedQuotes}
            icon="check_circle"
            tone="success"
            description="Quotations that successfully converted into work."
          />
          <StatCard
            label="Completed Jobs"
            value={stats.completedJobs}
            icon="workspace_premium"
            tone="info"
            description={averageRating > 0 ? `Current average rating: ${averageRating.toFixed(1)} / 5` : 'Build momentum with each completed job.'}
          />
        </div>

        {loading ? <LoadingPanel message="Loading your dashboard..." /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn’t load your dashboard"
            action={<button onClick={loadDashboard} className="ui-button-primary" type="button">Try Again</button>}
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && quotes.length === 0 && jobs.length === 0 && !needsProfile ? (
          <EmptyState
            icon="handyman"
            title="Your dashboard is ready for action"
            text="Browse open requests, submit your first quotation, and start building a strong work history."
            action={<Link to="/browse-requests" className="ui-button-primary">Browse Requests</Link>}
          />
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-5">
              <SectionCard className="overflow-hidden !p-0">
                <div className="border-b border-line bg-surface-muted/70 px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="ui-stat-label">Current Workload</p>
                      <h2 className="mt-2 text-2xl font-bold text-ink">Active Jobs</h2>
                    </div>
                    <p className="text-sm font-medium text-ink-muted">
                      Clear status, seeker, and location details to help you scan your active work fast.
                    </p>
                  </div>
                </div>

                {activeJobs.length === 0 ? (
                  <div className="px-6 py-8">
                    <EmptyState
                      icon="work_off"
                      title="No active jobs right now"
                      text="Accepted jobs will show up here once a seeker assigns work to you."
                      className="max-w-full border-none bg-transparent px-0 py-0 shadow-none"
                      action={<Link to="/browse-requests" className="ui-button-primary">Find Work</Link>}
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {activeJobs.map((job) => (
                      <article key={job.requestId} className="bg-white px-6 py-6 transition hover:bg-brand-50/35">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {job.category ? <span className="ui-badge">{formatCategoryLabel(job.category)}</span> : null}
                              <StatusPill tone={jobStatusTone(job.status)}>{prettyLabel(job.status)}</StatusPill>
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold leading-tight text-ink">
                                {job.requestTitle || `Request #${job.requestId}`}
                              </h3>
                              <p className="mt-3 text-sm leading-7 text-ink-muted">
                                {job.description
                                  ? excerpt(job.description)
                                  : 'Open the job details to review scope, timing, and any seeker-specific notes.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[320px] lg:max-w-[370px]">
                            <div className="rounded-card border border-line bg-surface-muted px-4 py-4 shadow-soft">
                              <p className="ui-stat-label">Seeker</p>
                              <p className="mt-2 text-sm font-semibold text-ink">{job.seekerName || 'Unknown'}</p>
                            </div>
                            <div className="rounded-card border border-line bg-surface-muted px-4 py-4 shadow-soft">
                              <p className="ui-stat-label">Location</p>
                              <p className="mt-2 text-sm font-semibold text-ink">{job.locationArea || 'Not set'}</p>
                            </div>
                            <div className="rounded-card border border-line bg-surface-muted px-4 py-4 shadow-soft">
                              <p className="ui-stat-label">Budget</p>
                              <p className="mt-2 text-sm font-semibold text-ink">
                                {job.budget !== null && job.budget !== undefined ? `Rs. ${Number(job.budget).toLocaleString()}` : 'Negotiable'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-medium text-ink-muted">
                            Use the full request view to manage job updates and submit work outcomes clearly.
                          </p>
                          <Link to={`/requests/${job.requestId}`} className="ui-button-primary">
                            View Job
                            <span className="material-icons text-base">arrow_forward</span>
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard className="overflow-hidden !p-0">
                <div className="border-b border-line bg-surface-muted/70 px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="ui-stat-label">Quote Pipeline</p>
                      <h2 className="mt-2 text-2xl font-bold text-ink">Recent Quotations</h2>
                    </div>
                    <Link to="/my-quotations" className="ui-link">
                      Review all quotations
                      <span className="material-icons text-base">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                {recentQuotes.length === 0 ? (
                  <div className="px-6 py-8">
                    <EmptyState
                      icon="request_quote"
                      title="No quotations yet"
                      text="Start quoting on open requests to build your pipeline and win work."
                      className="max-w-full border-none bg-transparent px-0 py-0 shadow-none"
                      action={<Link to="/browse-requests" className="ui-button-primary">Browse Requests</Link>}
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {recentQuotes.map((quote) => (
                      <article key={quote.id} className="bg-white px-6 py-5 transition hover:bg-brand-50/35">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="ui-badge-muted">Quote #{quote.id}</span>
                              <StatusPill tone={quoteStatusTone(quote.status)}>{prettyLabel(quote.status)}</StatusPill>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold leading-tight text-ink">
                                {quote.requestTitle || `Request #${quote.requestId}`}
                              </h3>
                              <p className="mt-2 text-sm leading-7 text-ink-muted">
                                {quote.message
                                  ? excerpt(quote.message)
                                  : 'Open the request details to review what you quoted and what the seeker requested.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[320px] lg:max-w-[360px]">
                            <div className="rounded-card border border-line bg-surface-muted px-4 py-4 shadow-soft">
                              <p className="ui-stat-label">Quoted Price</p>
                              <p className="mt-2 text-sm font-semibold text-ink">Rs. {Number(quote.price || 0).toLocaleString()}</p>
                            </div>
                            <div className="rounded-card border border-line bg-surface-muted px-4 py-4 shadow-soft">
                              <p className="ui-stat-label">ETA</p>
                              <p className="mt-2 text-sm font-semibold text-ink">
                                {quote.estimatedDays} {Number(quote.estimatedDays) === 1 ? 'day' : 'days'}
                              </p>
                            </div>
                            <div className="rounded-card border border-line bg-surface-muted px-4 py-4 shadow-soft">
                              <p className="ui-stat-label">Request</p>
                              <p className="mt-2 text-sm font-semibold text-ink">#{quote.requestId}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <aside className="space-y-5">
              <SectionCard className="border-brand-100 bg-white shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="ui-stat-label">Profile Health</p>
                    <h2 className="mt-2 text-2xl font-bold text-ink">
                      {profile?.fullName || currentUser?.fullName || 'Worker Profile'}
                    </h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white shadow-brand">
                    {(profile?.fullName || currentUser?.fullName || 'W').charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-card border border-line bg-surface-muted px-4 py-4">
                    <p className="ui-stat-label">Verification</p>
                    <div className="mt-2">
                      <StatusPill tone={verificationTone(verificationStatus)}>{prettyLabel(verificationStatus)}</StatusPill>
                    </div>
                  </div>
                  <div className="rounded-card border border-line bg-surface-muted px-4 py-4">
                    <p className="ui-stat-label">Availability</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{profile?.availability || 'Not set yet'}</p>
                  </div>
                  <div className="rounded-card border border-line bg-surface-muted px-4 py-4">
                    <p className="ui-stat-label">Base District</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{profile?.district || 'Not set yet'}</p>
                  </div>
                  <div className="rounded-card border border-line bg-surface-muted px-4 py-4">
                    <p className="ui-stat-label">Bio Snapshot</p>
                    <p className="mt-2 text-sm leading-7 text-ink-muted">{excerpt(profile?.bio, 150)}</p>
                  </div>
                </div>

                {skills.length > 0 ? (
                  <div className="mt-5">
                    <p className="ui-stat-label">Top Skills</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span key={skill} className="ui-badge">{skill}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SectionCard>

              {/* SCRUM-92 — Disputes section */}
              <SectionCard className="overflow-hidden !p-0">
                <div className="border-b border-line bg-surface-muted/70 px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="ui-stat-label">Dispute History</p>
                      <h2 className="mt-2 text-2xl font-bold text-ink">Your Disputes</h2>
                    </div>
                    {disputes.filter((d) => String(d.status).toUpperCase() === 'OPEN').length > 0 ? (
                      <StatusPill tone="danger" icon="gavel">
                        {disputes.filter((d) => String(d.status).toUpperCase() === 'OPEN').length} Open
                      </StatusPill>
                    ) : null}
                  </div>
                </div>

                {disputes.length === 0 ? (
                  <div className="px-6 py-8">
                    <EmptyState
                      icon="verified"
                      title="You have no active or past disputes."
                      text="Jobs completed without issues will not appear here. Keep delivering great work!"
                      className="max-w-full border-none bg-transparent px-0 py-0 shadow-none"
                    />
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {disputes.map((dispute) => {
                      const isOpen = String(dispute.status).toUpperCase() === 'OPEN';
                      const isExpanded = expandedDisputeId === dispute.id;
                      return (
                        <article key={dispute.id} className="bg-white px-6 py-5 transition hover:bg-brand-50/30">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-ink">
                                {dispute.requestTitle || `Request #${dispute.requestId}`}
                              </h3>
                              <p className="text-xs text-ink-muted">
                                Raised by <span className="font-semibold">{dispute.seekerName || 'Seeker'}</span>
                                {dispute.createdAt ? ` · ${new Date(dispute.createdAt).toLocaleDateString()}` : ''}
                              </p>
                            </div>
                            <StatusPill tone={isOpen ? 'danger' : 'success'}>
                              {isOpen ? 'Open Dispute' : 'Resolved'}
                            </StatusPill>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedDisputeId(isExpanded ? null : dispute.id)}
                            className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                          >
                            <span className="material-icons text-sm">
                              {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                            {isExpanded ? 'Hide details' : 'View complaint'}
                          </button>

                          {isExpanded ? (
                            <div className="mt-4 space-y-3 rounded-card border border-line bg-surface-muted/70 px-4 py-4">
                              <div>
                                <p className="ui-stat-label mb-1">Seeker's Reason</p>
                                <p className="text-sm leading-6 text-ink">
                                  {dispute.seekerReason || 'No reason provided.'}
                                </p>
                              </div>
                              {!isOpen && dispute.resolution ? (
                                <div className="border-t border-line pt-3">
                                  <p className="ui-stat-label mb-1">Admin Resolution</p>
                                  <p className="text-sm leading-6 text-ink">{dispute.resolution}</p>
                                  {dispute.resolvedAt ? (
                                    <p className="mt-1 text-xs text-ink-muted">
                                      Resolved on {new Date(dispute.resolvedAt).toLocaleDateString()}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                              {isOpen ? (
                                <div className="border-t border-line pt-3">
                                  <p className="text-xs text-ink-muted">
                                    This dispute is under admin review. You will be notified once a decision is made.
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </SectionCard>

              <SectionCard className="border-brand-100 bg-white shadow-card">
                <p className="ui-stat-label">Quick Actions</p>
                <h2 className="mt-2 text-2xl font-bold text-ink">Stay Visible</h2>
                <div className="mt-5 space-y-3">
                  <Link to="/browse-requests" className="flex items-start gap-4 rounded-card border border-line bg-surface-muted px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/60">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                      <span className="material-icons">travel_explore</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-ink">Find new requests</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">Keep your pipeline full with nearby opportunities.</span>
                    </span>
                  </Link>

                  <Link to="/my-quotations" className="flex items-start gap-4 rounded-card border border-line bg-surface-muted px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/60">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-900">
                      <span className="material-icons">request_quote</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-ink">Track quotations</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">Review pending offers and follow your conversion rate.</span>
                    </span>
                  </Link>

                  <Link to="/my-jobs" className="flex items-start gap-4 rounded-card border border-line bg-surface-muted px-4 py-4 transition hover:border-brand-200 hover:bg-brand-50/60">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-900">
                      <span className="material-icons">handyman</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-ink">Manage active jobs</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-muted">Jump into assigned work and keep delivery moving.</span>
                    </span>
                  </Link>
                </div>
              </SectionCard>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default WorkerDashboard;
