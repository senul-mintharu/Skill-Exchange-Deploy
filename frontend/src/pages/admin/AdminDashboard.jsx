import React from 'react';
import { Link } from 'react-router-dom';
import { PageIntro, SectionCard, StatCard } from '../../components/ui/PortalPrimitives';

const AdminDashboard = () => (
  <div className="page-wrapper">
    <main className="ui-shell space-y-6">
      <PageIntro
        eyebrow="Admin"
        title="Admin Dashboard"
        subtitle="Review moderation queues, resolve disputes quickly, and keep marketplace quality high."
        light
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Verification Queue" value="Review Now" icon="fact_check" tone="warning" />
        <StatCard label="Disputes" value="Active Cases" icon="gavel" tone="danger" />
        <StatCard label="Payment Slips" value="Review Now" icon="receipt_long" tone="warning" />
      </div>

      <SectionCard className="space-y-4">
        <h2 className="text-xl font-bold text-ink">Quick Actions</h2>
        <p className="text-sm leading-7 text-ink-muted">
          Access active moderation workflows directly from the dashboard.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/admin/verification" className="ui-button-primary w-full justify-center">
            <span className="material-icons text-base">fact_check</span>
            Verification Review
          </Link>
          <Link to="/admin/disputes" className="ui-button-secondary w-full justify-center">
            <span className="material-icons text-base">gavel</span>
            Disputes Management
          </Link>
          <Link to="/admin/payment-slips" className="ui-button-secondary w-full justify-center">
            <span className="material-icons text-base">receipt_long</span>
            Payment Slip Review
          </Link>
        </div>
      </SectionCard>
    </main>
  </div>
);

export default AdminDashboard;
