import React from 'react';
import { Link } from 'react-router-dom';

const serviceMap = {
  Plumbing: { icon: 'plumbing', title: 'Plumbing Services', desc: 'Pipe repairs, installations, and maintenance' },
  Electrical: { icon: 'bolt', title: 'Electrical Work', desc: 'Wiring, repairs, and installations' },
  Carpentry: { icon: 'carpenter', title: 'Carpentry', desc: 'Custom woodwork and furniture repairs' },
  Painting: { icon: 'format_paint', title: 'Painting Services', desc: 'Interior and exterior painting' },
  'AC Repair': { icon: 'ac_unit', title: 'AC Servicing & Repair', desc: 'Installation, maintenance, and repairs' },
  Cleaning: { icon: 'cleaning_services', title: 'Cleaning Services', desc: 'Deep cleaning and maintenance' },
  Gardening: { icon: 'yard', title: 'Gardening', desc: 'Landscaping and garden maintenance' },
  Masonry: { icon: 'construction', title: 'Masonry Work', desc: 'Brick, stone, and concrete work' },
  Roofing: { icon: 'roofing', title: 'Roofing Services', desc: 'Roof repairs and installations' },
  'Appliance Repair': { icon: 'kitchen', title: 'Appliance Repair', desc: 'Home appliance repairs and maintenance' },
  CCTV: { icon: 'videocam', title: 'Security Systems', desc: 'CCTV installation and setup' },
  Wiring: { icon: 'electrical_services', title: 'Full House Wiring', desc: 'Complete electrical wiring solutions' },
  Switchboard: { icon: 'toggle_on', title: 'Switchboard Installation', desc: 'Professional switchboard setup' },
  default: { icon: 'build', title: 'General Services', desc: 'Professional handyman services' },
};

const getFirstName = (fullName) => {
  if (!fullName) return 'Worker';
  return fullName.split(' ')[0];
};

const getPrimarySkill = (skills) => {
  if (!skills || skills.length === 0) return 'Professional';
  return skills[0];
};

const getServiceCards = (skills) => {
  if (!skills || skills.length === 0) {
    return [serviceMap.default];
  }

  return skills.slice(0, 4).map((skill) => {
    const match = Object.keys(serviceMap).find((key) =>
      skill.toLowerCase().includes(key.toLowerCase())
    );
    return match ? serviceMap[match] : {
      icon: 'handyman',
      title: skill,
      desc: `Professional ${skill.toLowerCase()} services`,
    };
  });
};

export const WorkerProfileSkeleton = () => (
  <div className="page-wrapper">
    <main className="ui-shell">
      <div className="ui-panel p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="ui-skeleton h-28 w-28 rounded-full md:h-40 md:w-40" />
          <div className="flex-1 space-y-4">
            <div className="ui-skeleton h-8 w-72" />
            <div className="ui-skeleton h-6 w-56" />
            <div className="ui-skeleton h-5 w-40" />
            <div className="flex flex-wrap gap-3">
              <div className="ui-skeleton h-12 w-32 rounded-2xl" />
              <div className="ui-skeleton h-12 w-32 rounded-2xl" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="ui-skeleton h-28 rounded-card" />
          ))}
        </div>
        <div className="mt-8 space-y-5">
          <div className="ui-skeleton h-28 w-full rounded-card" />
          <div className="ui-skeleton h-40 w-full rounded-card" />
          <div className="ui-skeleton h-56 w-full rounded-card" />
        </div>
      </div>
    </main>
  </div>
);

export const WorkerProfileError = ({ message, action }) => (
  <div className="page-wrapper">
    <main className="ui-shell">
      <div className="ui-panel p-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600">
            <span className="material-icons text-5xl">error_outline</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-ink">Oops! Something went wrong</h2>
          <p className="mt-3 text-sm leading-7 text-ink-muted">{message}</p>
          <div className="mt-6">{action}</div>
        </div>
      </div>
    </main>
  </div>
);

export const WorkerProfilePanel = ({ profile, notice, actions, backLink }) => {
  const serviceCards = getServiceCards(profile.skills);
  const serviceAreas = profile.serviceAreas?.length ? profile.serviceAreas : [profile.district || 'Local Area', 'Nearby Cities'];

  const stats = [
    { label: 'Rating', value: profile.averageRating ? `${Number(profile.averageRating).toFixed(1)}/5` : '4.9/5', icon: 'star', palette: 'rating' },
    { label: 'Jobs Done', value: profile.totalJobsCompleted ?? 186, icon: 'work', palette: 'jobs' },
    { label: 'Years Exp.', value: profile.yearsExperience ? `${profile.yearsExperience}+` : '10+', icon: 'emoji_events', palette: 'experience' },
    { label: 'Location', value: profile.district || 'N/A', icon: 'location_on', palette: 'location' },
  ];

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        {backLink ? (
          <div className="text-white">{backLink}</div>
        ) : null}

        <section className="rounded-panel border border-white/70 bg-white px-4 py-5 shadow-panel sm:px-6 sm:py-6 md:px-8">
          {notice ? <div className="mb-5">{notice}</div> : null}

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-gradient text-4xl font-bold uppercase text-white shadow-brand sm:h-28 sm:w-28 sm:text-5xl">
                  {profile.profilePictureUrl ? (
                    <img src={profile.profilePictureUrl} alt={`${profile.fullName || 'Worker'} profile`} className="h-full w-full object-cover" />
                  ) : (
                    <span>{profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'W'}</span>
                  )}
                  <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-700 text-white">
                    <span className="material-icons text-sm">verified</span>
                  </span>
                </div>

                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-extrabold tracking-snugger text-ink sm:text-3xl">
                    {profile.fullName || 'Worker'}
                  </h1>
                  <p className="mt-2 text-base font-medium text-brand-800">
                    Verified Skilled {getPrimarySkill(profile.skills)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Member since July 2021 • Response time: &lt; 2 hours
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
                {actions}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-card border border-line bg-surface-muted/75 px-4 py-4 text-center shadow-soft">
                  <span className={`material-icons text-xl ${item.palette === 'rating' ? 'text-amber-500' : item.palette === 'jobs' ? 'text-blue-500' : item.palette === 'experience' ? 'text-emerald-500' : 'text-violet-500'}`}>
                    {item.icon}
                  </span>
                  <p className="mt-3 text-2xl font-extrabold text-ink">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle">{item.label}</p>
                </div>
              ))}
            </div>

            {profile.skills?.length ? (
              <section>
                <h2 className="text-xl font-bold text-ink sm:text-2xl">Expertise</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span key={`${skill}-${index}`} className="rounded-chip border border-brand-200 bg-chip-gradient px-4 py-2 text-sm font-semibold text-brand-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {profile.bio ? (
              <section>
                <h2 className="text-xl font-bold text-ink sm:text-2xl">About {getFirstName(profile.fullName)}</h2>
                <p className="mt-4 text-sm leading-8 text-ink-muted">
                  {profile.bio}
                </p>
              </section>
            ) : null}

            <section>
              <h2 className="text-xl font-bold text-ink sm:text-2xl">Services Offered</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {serviceCards.map((service) => (
                  <div key={service.title} className="rounded-card border border-line bg-surface-muted/75 p-4 shadow-soft">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-soft">
                        <span className="material-icons">{service.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-ink sm:text-lg">{service.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink-muted">{service.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-ink sm:text-2xl">Service Areas</h2>
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-muted">
                <span className="material-icons text-base text-brand-700">map</span>
                Based in {profile.district || 'Sri Lanka'}, serving the following areas:
              </p>
              <div className="mt-4 overflow-hidden rounded-card border border-line bg-gradient-to-r from-brand-300/70 via-brand-200/55 to-brand-400/60 p-4 sm:p-5">
                <div className="rounded-card bg-white/92 px-4 py-4 shadow-card sm:mx-auto sm:max-w-xl">
                  <div className="flex flex-wrap justify-center gap-2">
                    {serviceAreas.map((area, index) => (
                      <span key={`${area}-${index}`} className="rounded-lg bg-surface-muted px-3 py-2 text-sm font-semibold text-brand-800">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-ink sm:text-2xl">Portfolio & Past Work</h2>
                <button type="button" className="text-sm font-semibold text-brand-800 transition hover:text-brand-900">
                  View All
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="aspect-[4/5] rounded-card border border-line bg-surface-muted">
                    <div className="flex h-full items-center justify-center text-ink-subtle">
                      <span className="material-icons text-4xl">image</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export const WorkerProfileBackButton = ({ to, label }) => (
  <Link to={to} className="ui-link text-white">
    <span className="material-icons text-base">arrow_back</span>
    {label}
  </Link>
);
