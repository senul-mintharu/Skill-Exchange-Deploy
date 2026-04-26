import React from 'react';
import { Link } from 'react-router-dom';
import { PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';

const AdminDashboard = () => (
  <div className="page-wrapper">
    <main className="ui-shell space-y-6">
      <PageIntro
        eyebrow="Admin"
        title="Admin Dashboard"
        subtitle="Manage platform operations from one place. Every box below is a working entry point."
        light
      />

      <SectionCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-ink">Operations</h2>
          <StatusPill tone="info" icon="dashboard_customize">
            Functional shortcuts only
          </StatusPill>
        </div>
        <p className="text-sm leading-7 text-ink-muted">
          Trust workflow and disputes are handled together through Dispute Management. Use these boxes to open each active admin area.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            to="/admin/disputes"
            className="group rounded-card border-2 border-amber-300 bg-gradient-to-br from-amber-100 via-amber-50 to-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full border border-amber-300 bg-amber-200/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-900">
                  Trust + Conflict
                </p>
                <h3 className="mt-2 text-lg font-bold text-ink">Dispute Management</h3>
              </div>
              <span className="material-icons rounded-xl bg-amber-200 p-2 text-amber-900 shadow-soft">gavel</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Review disputes, call both parties, then resolve as completed or take enforcement action.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-amber-900 group-hover:text-amber-950">
              Open disputes
            </span>
          </Link>

          <Link
            to="/admin/verification"
            className="group rounded-card border-2 border-brand-300 bg-gradient-to-br from-brand-100 via-brand-50 to-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full border border-brand-300 bg-brand-200/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-900">
                  Worker Quality
                </p>
                <h3 className="mt-2 text-lg font-bold text-ink">Verification Review</h3>
              </div>
              <span className="material-icons rounded-xl bg-brand-200 p-2 text-brand-900 shadow-soft">fact_check</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Approve or reject worker verification submissions with reasons.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-brand-900 group-hover:text-brand-950">
              Open verification queue
            </span>
          </Link>

          <Link
            to="/admin/payment-slips"
            className="group rounded-card border-2 border-cyan-300 bg-gradient-to-br from-cyan-100 via-cyan-50 to-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full border border-cyan-300 bg-cyan-200/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-900">
                  Payments
                </p>
                <h3 className="mt-2 text-lg font-bold text-ink">Slip Review</h3>
              </div>
              <span className="material-icons rounded-xl bg-cyan-200 p-2 text-cyan-900 shadow-soft">receipt_long</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Validate seeker and worker registration payment slips.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-900 group-hover:text-cyan-950">
              Open payment queue
            </span>
          </Link>

          <Link
            to="/admin/users"
            className="group rounded-card border-2 border-violet-300 bg-gradient-to-br from-violet-100 via-violet-50 to-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-panel"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full border border-violet-300 bg-violet-200/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-900">
                  Accounts
                </p>
                <h3 className="mt-2 text-lg font-bold text-ink">User Management</h3>
              </div>
              <span className="material-icons rounded-xl bg-violet-200 p-2 text-violet-900 shadow-soft">groups</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              Monitor users, review account state, and apply admin controls.
            </p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-violet-900 group-hover:text-violet-950">
              Open users
            </span>
          </Link>
        </div>
      </SectionCard>

      <SectionCard className="space-y-4">
        <h2 className="text-xl font-bold text-ink">Dispute Resolution Policy</h2>
        <p className="text-sm leading-7 text-ink-muted">
          For each dispute, contact both parties first. Then choose one of the two final outcomes below in the dispute detail page.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-card border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">Resolved verbally</p>
            <p className="mt-1 text-sm leading-6 text-green-800">
              Mark as resolved and complete the job.
            </p>
          </div>
          <div className="rounded-card border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">Cannot resolve verbally</p>
            <p className="mt-1 text-sm leading-6 text-red-800">
              Ban (suspend) the worker and close as conflicted completion.
            </p>
          </div>
        </div>
      </SectionCard>
    </main>
  </div>
);

export default AdminDashboard;
