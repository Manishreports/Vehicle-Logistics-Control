import React from 'react';
import PageHeader from '../components/PageHeader';
import KPICard from '../components/KPICard';
import SectionPanel from '../components/SectionPanel';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  return (
    <div className="page-content">
      <PageHeader title="Dashboard" description="STO & Vehicle Management System" />

      <section className="kpi-grid">
        <KPICard label="Total Vehicles" />
        <KPICard label="Planned Vehicles" />
        <KPICard label="Pending Vehicles" tone="warning" />
        <KPICard label="Dispatched Vehicles" tone="success" />
        <KPICard label="Cancelled Vehicles" tone="danger" />
      </section>

      <div className="dashboard-grid">
        <SectionPanel title="Vehicle Planning Overview" subtitle="Reserved for future planning analytics">
          <EmptyState title="Planning overview not yet connected" description="Future phases can populate planned, pending, cancelled and date-wise planning data here." />
        </SectionPanel>
        <SectionPanel title="Vehicle Status Overview" subtitle="Reserved for future status analytics">
          <EmptyState title="Vehicle status not yet connected" description="Vehicle In, Vehicle Out, pending and dispatched metrics will be connected in a later phase." />
        </SectionPanel>
        <SectionPanel title="STO Overview" subtitle="Reserved for future STO analytics">
          <EmptyState title="STO overview not yet connected" description="Total, completed, pending and exception STO metrics are reserved for the next phase." />
        </SectionPanel>
        <SectionPanel title="Alerts / Exceptions" subtitle="Operational issues will appear here">
          <EmptyState title="No alerts to display" description="The alert framework is ready for future validation and exception rules." />
        </SectionPanel>
      </div>
    </div>
  );
}
