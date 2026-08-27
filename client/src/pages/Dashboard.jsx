import React, { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import KPICard from '../components/KPICard';
import SectionPanel from '../components/SectionPanel';
import EmptyState from '../components/EmptyState';
import { dataStore, useDataStoreSubscription } from '../services/dataStore';
import { getDashboardAlerts, getDashboardMetrics } from '../services/dashboardService';
import { displayDate } from '../services/normalization';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(getDashboardMetrics);
  const [alerts, setAlerts] = useState(getDashboardAlerts);
  const refresh = useCallback(() => { setMetrics(getDashboardMetrics()); setAlerts(getDashboardAlerts()); }, []);
  useEffect(() => useDataStoreSubscription(refresh), [refresh]);

  return (
    <div className="page-content">
      <PageHeader title="Dashboard" />

      <section className="kpi-grid">
        <KPICard label="Total Planned Vehicles" value={metrics.totalPlannedVehicles} />
        <KPICard label="Vehicle Called" value={metrics.vehicleCalled} />
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
        <SectionPanel title="Alerts / Exceptions" subtitle="Plan and vehicle-call group comparison">
          {alerts.length ? (
            <div className="table-wrap">
              <table className="enterprise-table dashboard-alert-table">
                <thead><tr><th>Date</th><th>Name</th><th>Loading</th><th>Remarks</th></tr></thead>
                <tbody>{alerts.map((alert, index) => <tr key={`${alert.remarks}-${alert.date}-${alert.name}-${alert.loading}-${index}`}><td>{displayDate(alert.date)}</td><td>{alert.name}</td><td>{alert.loading}</td><td>{alert.remarks}</td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No alerts to display" description="Plan and vehicle-call groups are currently matched." />
          )}
        </SectionPanel>
      </div>
    </div>
  );
}
