import React from 'react';
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
        <StatCard label="Disputes" value="Awaiting Modules" icon="gavel" />
        <StatCard label="User Controls" value="Coming Soon" icon="manage_accounts" />
      </div>

      <SectionCard>
        <h2 className="text-xl font-bold text-ink">Current Scope</h2>
        <p className="mt-3 text-sm leading-7 text-ink-muted">
          This area is ready for the shared portal design system and can now be extended
          without adding another page-specific stylesheet.
        </p>
      </SectionCard>
    </main>
  </div>
);

export default AdminDashboard;
