import React from 'react';
import { Link } from 'react-router-dom';
import { PageIntro, SectionCard, StatCard } from '../../components/ui/PortalPrimitives';

const AdminDashboard = () => (
  <div className="page-wrapper">
    <main className="ui-shell space-y-6">
      <PageIntro
        eyebrow="Admin"
        title="Admin Dashboard"
        subtitle="Platform moderation and operational tools will expand here in future sprints."
        light
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Verification Queue" value="Pending" icon="fact_check" />
        <StatCard label="Disputes" value="Open Cases" icon="gavel" />
        <StatCard label="User Controls" value="Coming Soon" icon="manage_accounts" />
      </div>

      <SectionCard className="space-y-4">
        <h2 className="text-xl font-bold text-ink">Quick Actions</h2>
        <p className="text-sm leading-7 text-ink-muted">
          Access active moderation workflows directly from the dashboard.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <Link to="/admin/disputes" className="ui-button-secondary w-full justify-center">
            <span className="material-icons text-base">gavel</span>
            Open Disputes Management
          </Link>
        </div>
      </SectionCard>
    </main>
  </div>
);

export default AdminDashboard;
